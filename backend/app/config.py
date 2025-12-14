"""Application configuration using pydantic-settings."""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Application
    APP_NAME: str = "Grocery Price Tracker"
    DEBUG: bool = True
    
    # Database (SQLite by default)
    DATABASE_URL: str = "sqlite+aiosqlite:///./grocery_tracker.db"
    
    # JWT Settings
    SECRET_KEY: str = "your-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Google OAuth
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/auth/google/callback"
    
    # Gemini API (for OCR)
    GEMINI_API_KEY: str = ""
    
    # Frontend URL (for CORS)
    FRONTEND_URL: str = "http://localhost:5173"
    
    # File uploads
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    
    class Config:
        env_file = ".env"
        extra = "allow"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()
