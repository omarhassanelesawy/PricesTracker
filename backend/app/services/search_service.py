"""Search service for item and price queries."""

from datetime import date
from decimal import Decimal
from typing import Optional, List

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_, desc, asc
from sqlalchemy.orm import joinedload

from app.models.item import Item
from app.models.receipt import Receipt
from app.schemas.item import (
    ItemSearchResult,
    PriceHistoryPoint,
    PriceHistoryResponse,
    SearchResponse,
)


class SearchService:
    """Service for searching items and viewing price history."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def search_items(
        self,
        user_id: str,
        keyword: str,
        supermarket: Optional[str] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
        sort_by: str = "date",
        sort_order: str = "desc",
        page: int = 1,
        page_size: int = 20,
    ) -> SearchResponse:
        """Search items by keyword across user's receipts."""
        # Build base query with joins
        query = (
            select(Item, Receipt)
            .join(Receipt, Item.receipt_id == Receipt.id)
            .where(Receipt.user_id == user_id)
        )
        
        # Apply keyword search (case-insensitive, partial match)
        keyword_filter = or_(
            func.lower(Item.name).contains(keyword.lower()),
            func.lower(Item.brand).contains(keyword.lower()),
        )
        query = query.where(keyword_filter)
        
        # Apply supermarket filter
        if supermarket:
            query = query.where(
                func.lower(Receipt.supermarket_name).contains(supermarket.lower())
            )
        
        # Apply date range filters
        if date_from:
            query = query.where(Receipt.purchase_date >= date_from)
        if date_to:
            query = query.where(Receipt.purchase_date <= date_to)
        
        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar()
        
        # Apply sorting
        if sort_by == "date":
            order_col = Receipt.purchase_date
        else:  # price
            order_col = Item.price
        
        if sort_order == "desc":
            query = query.order_by(desc(order_col))
        else:
            query = query.order_by(asc(order_col))
        
        # Apply pagination
        offset = (page - 1) * page_size
        query = query.offset(offset).limit(page_size)
        
        # Execute query
        result = await self.db.execute(query)
        rows = result.all()
        
        # Convert to response objects
        results = []
        for item, receipt in rows:
            results.append(ItemSearchResult(
                id=item.id,
                name=item.name,
                brand=item.brand,
                price=item.price,
                quantity=item.quantity,
                unit=item.unit,
                supermarket_name=receipt.supermarket_name,
                purchase_date=receipt.purchase_date,
                currency=receipt.currency,
            ))
        
        total_pages = (total + page_size - 1) // page_size
        
        return SearchResponse(
            results=results,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )
    
    async def get_price_history(
        self,
        user_id: str,
        item_name: str,
        supermarket: Optional[str] = None,
    ) -> PriceHistoryResponse:
        """Get price history for a specific item."""
        query = (
            select(Item, Receipt)
            .join(Receipt, Item.receipt_id == Receipt.id)
            .where(Receipt.user_id == user_id)
            .where(func.lower(Item.name).contains(item_name.lower()))
            .order_by(Receipt.purchase_date)
        )
        
        if supermarket:
            query = query.where(
                func.lower(Receipt.supermarket_name).contains(supermarket.lower())
            )
        
        result = await self.db.execute(query)
        rows = result.all()
        
        history: List[PriceHistoryPoint] = []
        lowest: Optional[PriceHistoryPoint] = None
        highest: Optional[PriceHistoryPoint] = None
        total_price = Decimal("0")
        
        for item, receipt in rows:
            point = PriceHistoryPoint(
                date=receipt.purchase_date,
                price=item.price,
                supermarket_name=receipt.supermarket_name,
                currency=receipt.currency,
            )
            history.append(point)
            total_price += item.price
            
            if lowest is None or item.price < lowest.price:
                lowest = point
            if highest is None or item.price > highest.price:
                highest = point
        
        average = total_price / len(history) if history else None
        
        return PriceHistoryResponse(
            item_name=item_name,
            history=history,
            lowest_price=lowest,
            highest_price=highest,
            average_price=average,
        )
    
    async def get_supermarket_suggestions(
        self,
        user_id: str,
        query: str = "",
    ) -> List[str]:
        """Get supermarket name suggestions for autocomplete."""
        stmt = (
            select(Receipt.supermarket_name)
            .where(Receipt.user_id == user_id)
            .distinct()
        )
        
        if query:
            stmt = stmt.where(
                func.lower(Receipt.supermarket_name).contains(query.lower())
            )
        
        stmt = stmt.limit(10)
        
        result = await self.db.execute(stmt)
        return [row[0] for row in result.all()]
