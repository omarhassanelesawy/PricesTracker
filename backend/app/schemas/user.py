"""User schemas for API request/response validation."""

from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from enum import Enum


class CurrencyType(str, Enum):
    """Supported currency types."""
    USD = "USD"
    EGP = "EGP"
    EUR = "EUR"
    GBP = "GBP"
    SAR = "SAR"
    AED = "AED"


class UserCreate(BaseModel):
    """Schema for user registration."""
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    name: str = Field(..., min_length=2, max_length=255)
    currency: CurrencyType = CurrencyType.USD


class UserLogin(BaseModel):
    """Schema for user login."""
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    """Schema for updating user profile."""
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    currency: Optional[CurrencyType] = None


class UserResponse(BaseModel):
    """Schema for user response."""
    id: str
    email: str
    name: str
    currency: str
    oauth_provider: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    """Schema for JWT token response."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenData(BaseModel):
    """Schema for decoded token data."""
    user_id: Optional[str] = None
    email: Optional[str] = None
