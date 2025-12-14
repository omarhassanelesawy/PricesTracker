"""Item management routes."""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.user import User
from app.models.receipt import Receipt
from app.models.item import Item
from app.schemas.item import ItemCreate, ItemUpdate, ItemResponse
from app.utils.security import get_current_user


router = APIRouter(prefix="/items", tags=["Items"])


@router.post("/{receipt_id}", response_model=ItemResponse, status_code=status.HTTP_201_CREATED)
async def add_item_to_receipt(
    receipt_id: str,
    item_data: ItemCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add an item to an existing receipt."""
    # Verify receipt belongs to user
    result = await db.execute(
        select(Receipt)
        .where(Receipt.id == receipt_id, Receipt.user_id == current_user.id)
    )
    receipt = result.scalar_one_or_none()
    
    if not receipt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Receipt not found"
        )
    
    # Create item
    item = Item(
        receipt_id=receipt_id,
        name=item_data.name,
        brand=item_data.brand,
        price=item_data.price,
        quantity=item_data.quantity,
        unit=item_data.unit,
    )
    db.add(item)
    
    # Update receipt total
    receipt.total_amount += item_data.price * item_data.quantity
    
    await db.commit()
    await db.refresh(item)
    
    return ItemResponse.model_validate(item)


@router.put("/{item_id}", response_model=ItemResponse)
async def update_item(
    item_id: str,
    update_data: ItemUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an item."""
    # Get item with receipt to verify ownership
    result = await db.execute(
        select(Item)
        .join(Receipt)
        .where(Item.id == item_id, Receipt.user_id == current_user.id)
        .options(selectinload(Item.receipt))
    )
    item = result.scalar_one_or_none()
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )
    
    # Track price change for receipt total
    old_total = item.price * item.quantity
    
    # Update fields
    if update_data.name is not None:
        item.name = update_data.name
    if update_data.brand is not None:
        item.brand = update_data.brand
    if update_data.price is not None:
        item.price = update_data.price
    if update_data.quantity is not None:
        item.quantity = update_data.quantity
    if update_data.unit is not None:
        item.unit = update_data.unit
    
    # Update receipt total
    new_total = item.price * item.quantity
    item.receipt.total_amount += (new_total - old_total)
    
    await db.commit()
    await db.refresh(item)
    
    return ItemResponse.model_validate(item)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(
    item_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete an item from a receipt."""
    # Get item with receipt to verify ownership
    result = await db.execute(
        select(Item)
        .join(Receipt)
        .where(Item.id == item_id, Receipt.user_id == current_user.id)
        .options(selectinload(Item.receipt))
    )
    item = result.scalar_one_or_none()
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )
    
    # Update receipt total
    item.receipt.total_amount -= item.price * item.quantity
    
    await db.delete(item)
    await db.commit()
