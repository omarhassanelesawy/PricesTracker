"""Item schemas for API request/response validation."""

from datetime import datetime, date
from decimal import Decimal
from pydantic import BaseModel, Field
from typing import Optional, List


class ItemCreate(BaseModel):
    """Schema for creating an item."""
    name: str = Field(..., min_length=1, max_length=255)
    brand: Optional[str] = Field(None, max_length=255)
    price: Decimal = Field(..., ge=0)
    quantity: Decimal = Field(default=Decimal("1"), ge=0)
    unit: Optional[str] = Field(None, max_length=50)


class ItemUpdate(BaseModel):
    """Schema for updating an item."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    brand: Optional[str] = Field(None, max_length=255)
    price: Optional[Decimal] = Field(None, ge=0)
    quantity: Optional[Decimal] = Field(None, ge=0)
    unit: Optional[str] = Field(None, max_length=50)


class ItemResponse(BaseModel):
    """Schema for item response."""
    id: str
    receipt_id: str
    name: str
    brand: Optional[str] = None
    price: Decimal
    quantity: Decimal
    unit: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class ItemSearchResult(BaseModel):
    """Schema for search result item with supermarket info."""
    id: str
    name: str
    brand: Optional[str] = None
    price: Decimal
    quantity: Decimal
    unit: Optional[str] = None
    supermarket_name: str
    purchase_date: date
    currency: str
    
    class Config:
        from_attributes = True


class PriceHistoryPoint(BaseModel):
    """Schema for price history data point."""
    date: date
    price: Decimal
    supermarket_name: str
    currency: str


class PriceHistoryResponse(BaseModel):
    """Schema for price history response."""
    item_name: str
    history: List[PriceHistoryPoint]
    lowest_price: Optional[PriceHistoryPoint] = None
    highest_price: Optional[PriceHistoryPoint] = None
    average_price: Optional[Decimal] = None


class SearchQuery(BaseModel):
    """Schema for search query parameters."""
    keyword: str = Field(..., min_length=1)
    supermarket: Optional[str] = None
    date_from: Optional[date] = None
    date_to: Optional[date] = None
    sort_by: str = Field(default="date", pattern="^(date|price)$")
    sort_order: str = Field(default="desc", pattern="^(asc|desc)$")
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)


class SearchResponse(BaseModel):
    """Schema for paginated search results."""
    results: List[ItemSearchResult]
    total: int
    page: int
    page_size: int
    total_pages: int
