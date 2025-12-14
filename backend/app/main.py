"""FastAPI application entry point."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from app.config import settings
from app.database import init_db
from app.routers import auth, receipts, items, search


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    # Startup
    await init_db()
    yield
    # Shutdown
    pass


# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    description="Track grocery prices across supermarkets",
    version="1.0.0",
    lifespan=lifespan,
)

# Add session middleware (required for OAuth)
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SECRET_KEY,
)

# Configure CORS - support both local and production
allowed_origins = [
    settings.FRONTEND_URL,
    "http://localhost:5173",
    "http://localhost:3000",
]

# Add Vercel preview URLs pattern
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",  # Allow all Vercel preview URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(receipts.router)
app.include_router(items.router)
app.include_router(search.router)


@app.get("/")
async def root():
    """Root endpoint with API info."""
    return {
        "name": settings.APP_NAME,
        "version": "1.0.0",
        "docs": "/docs",
        "status": "running",
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}
