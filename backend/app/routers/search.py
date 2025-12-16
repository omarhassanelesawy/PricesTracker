"""Search and price comparison routes."""

from datetime import date
from typing import Optional, List

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.utils.security import get_current_user
from app.services.search_service import SearchService
from app.schemas.item import SearchResponse, PriceHistoryResponse


router = APIRouter(prefix="/search", tags=["Search"])


@router.get("", response_model=SearchResponse)
async def search_items(
    keyword: str = Query(..., min_length=1, description="Search keyword"),
    supermarket: Optional[str] = Query(None, description="Filter by supermarket"),
    date_from: Optional[date] = Query(None, description="Filter from date"),
    date_to: Optional[date] = Query(None, description="Filter to date"),
    sort_by: str = Query("date", pattern="^(date|price)$", description="Sort by field"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$", description="Sort order"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    use_regex: bool = Query(False, description="Enable regex pattern matching"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Search for items across all receipts.
    
    Search matches against item name and brand (case-insensitive, partial match).
    When use_regex=true, the keyword is treated as a regex pattern.
    """
    search_service = SearchService(db)
    return await search_service.search_items(
        user_id=current_user.id,
        keyword=keyword,
        supermarket=supermarket,
        date_from=date_from,
        date_to=date_to,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size,
        use_regex=use_regex,
    )


@router.get("/history/{item_name}", response_model=PriceHistoryResponse)
async def get_price_history(
    item_name: str,
    supermarket: Optional[str] = Query(None, description="Filter by supermarket"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get price history for a specific item.
    
    Returns all price points over time, plus lowest, highest, and average prices.
    """
    search_service = SearchService(db)
    return await search_service.get_price_history(
        user_id=current_user.id,
        item_name=item_name,
        supermarket=supermarket,
    )


@router.get("/supermarkets", response_model=List[str])
async def get_supermarket_suggestions(
    q: str = Query("", description="Search query for autocomplete"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get supermarket name suggestions for autocomplete."""
    search_service = SearchService(db)
    return await search_service.get_supermarket_suggestions(
        user_id=current_user.id,
        query=q,
    )
