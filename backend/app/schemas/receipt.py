"""Receipt schemas for API request/response validation."""

from datetime import datetime, date
from decimal import Decimal
from pydantic import BaseModel, Field
from typing import Optional, List

from app.schemas.item import ItemCreate, ItemResponse


class ReceiptCreate(BaseModel):
    """Schema for creating a receipt with items."""
    supermarket_name: str = Field(..., min_length=1, max_length=255)
    purchase_date: date
    currency: str = Field(..., max_length=10)
    notes: Optional[str] = None
    items: List[ItemCreate] = Field(..., min_length=1)


class ReceiptUpdate(BaseModel):
    """Schema for updating a receipt."""
    supermarket_name: Optional[str] = Field(None, min_length=1, max_length=255)
    purchase_date: Optional[date] = None
    currency: Optional[str] = Field(None, max_length=10)
    notes: Optional[str] = None


class ReceiptResponse(BaseModel):
    """Schema for receipt response with items."""
    id: str
    user_id: str
    supermarket_name: str
    purchase_date: date
    total_amount: Decimal
    currency: str
    image_path: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    items: List[ItemResponse] = []
    
    class Config:
        from_attributes = True


class ReceiptListResponse(BaseModel):
    """Schema for paginated receipt list response."""
    receipts: List[ReceiptResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class OCRReceiptData(BaseModel):
    """Schema for OCR extracted receipt data."""
    supermarket_name: Optional[str] = None
    purchase_date: Optional[date] = None
    items: List[ItemCreate] = []
    total_amount: Optional[Decimal] = None
    raw_text: str
