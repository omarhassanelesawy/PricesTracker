"""Authentication service for user registration and login."""

from datetime import timedelta
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status

from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserResponse, Token
from app.utils.security import get_password_hash, verify_password, create_access_token
from app.config import settings


class AuthService:
    """Service for handling authentication operations."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def register(self, user_data: UserCreate) -> Token:
        """Register a new user."""
        # Check if user already exists
        result = await self.db.execute(
            select(User).where(User.email == user_data.email)
        )
        existing_user = result.scalar_one_or_none()
        
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Create new user
        hashed_password = get_password_hash(user_data.password)
        user = User(
            email=user_data.email,
            password_hash=hashed_password,
            name=user_data.name,
            currency=user_data.currency.value,
        )
        
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        
        # Generate token
        access_token = create_access_token(
            data={"sub": str(user.id), "email": user.email}
        )
        
        return Token(
            access_token=access_token,
            user=UserResponse.model_validate(user)
        )
    
    async def login(self, credentials: UserLogin) -> Token:
        """Authenticate user and return token."""
        result = await self.db.execute(
            select(User).where(User.email == credentials.email)
        )
        user = result.scalar_one_or_none()
        
        if not user or not user.password_hash:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        if not verify_password(credentials.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        access_token = create_access_token(
            data={"sub": str(user.id), "email": user.email}
        )
        
        return Token(
            access_token=access_token,
            user=UserResponse.model_validate(user)
        )
    
    async def get_or_create_oauth_user(
        self,
        email: str,
        name: str,
        oauth_provider: str,
        oauth_id: str,
    ) -> Token:
        """Get existing OAuth user or create new one."""
        result = await self.db.execute(
            select(User).where(User.email == email)
        )
        user = result.scalar_one_or_none()
        
        if user:
            # Update OAuth info if not set
            if not user.oauth_provider:
                user.oauth_provider = oauth_provider
                user.oauth_id = oauth_id
                await self.db.commit()
        else:
            # Create new OAuth user
            user = User(
                email=email,
                name=name,
                oauth_provider=oauth_provider,
                oauth_id=oauth_id,
            )
            self.db.add(user)
            await self.db.commit()
            await self.db.refresh(user)
        
        access_token = create_access_token(
            data={"sub": str(user.id), "email": user.email}
        )
        
        return Token(
            access_token=access_token,
            user=UserResponse.model_validate(user)
        )
    
    async def update_user(
        self,
        user: User,
        name: Optional[str] = None,
        currency: Optional[str] = None,
    ) -> UserResponse:
        """Update user profile."""
        if name is not None:
            user.name = name
        if currency is not None:
            user.currency = currency
        
        await self.db.commit()
        await self.db.refresh(user)
        
        return UserResponse.model_validate(user)
