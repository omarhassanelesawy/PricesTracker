"""Authentication routes for user registration, login, and OAuth."""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from authlib.integrations.starlette_client import OAuth

from app.database import get_db
from app.config import settings
from app.schemas.user import UserCreate, UserLogin, UserResponse, UserUpdate, Token
from app.services.auth_service import AuthService
from app.utils.security import get_current_user
from app.models.user import User


router = APIRouter(prefix="/auth", tags=["Authentication"])

# Initialize OAuth
oauth = OAuth()
if settings.GOOGLE_CLIENT_ID:
    oauth.register(
        name="google",
        client_id=settings.GOOGLE_CLIENT_ID,
        client_secret=settings.GOOGLE_CLIENT_SECRET,
        server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
        client_kwargs={"scope": "openid email profile"},
    )


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db),
):
    """Register a new user account."""
    auth_service = AuthService(db)
    return await auth_service.register(user_data)


@router.post("/login", response_model=Token)
async def login(
    credentials: UserLogin,
    db: AsyncSession = Depends(get_db),
):
    """Login with email and password."""
    auth_service = AuthService(db)
    return await auth_service.login(credentials)


@router.get("/google")
async def google_login(request: Request):
    """Initiate Google OAuth login."""
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Google OAuth not configured"
        )
    redirect_uri = settings.GOOGLE_REDIRECT_URI
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/google/callback")
async def google_callback(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Handle Google OAuth callback."""
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Google OAuth not configured"
        )
    
    try:
        token = await oauth.google.authorize_access_token(request)
        user_info = token.get("userinfo")
        
        if not user_info:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to get user info from Google"
            )
        
        email = user_info.get("email")
        name = user_info.get("name", email.split("@")[0])
        google_id = user_info.get("sub")
        
        auth_service = AuthService(db)
        token_response = await auth_service.get_or_create_oauth_user(
            email=email,
            name=name,
            oauth_provider="google",
            oauth_id=google_id,
        )
        
        # Redirect to frontend with token
        frontend_url = f"{settings.FRONTEND_URL}/auth/callback?token={token_response.access_token}"
        return RedirectResponse(url=frontend_url)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"OAuth error: {str(e)}"
        )


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user),
):
    """Get current user profile."""
    return UserResponse.model_validate(current_user)


@router.put("/me", response_model=UserResponse)
async def update_current_user_profile(
    update_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update current user profile."""
    auth_service = AuthService(db)
    return await auth_service.update_user(
        user=current_user,
        name=update_data.name,
        currency=update_data.currency.value if update_data.currency else None,
    )
