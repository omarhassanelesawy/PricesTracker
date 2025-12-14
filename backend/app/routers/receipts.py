"""Receipt management routes."""

import os
import uuid
from datetime import date
from decimal import Decimal
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.config import settings
from app.models.user import User
from app.models.receipt import Receipt
from app.models.item import Item
from app.schemas.receipt import (
    ReceiptCreate,
    ReceiptUpdate,
    ReceiptResponse,
    ReceiptListResponse,
    OCRReceiptData,
)
from app.schemas.item import ItemCreate
from app.utils.security import get_current_user
from app.services.ocr_service import ocr_service


router = APIRouter(prefix="/receipts", tags=["Receipts"])


@router.get("", response_model=ReceiptListResponse)
async def list_receipts(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    supermarket: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List user's receipts with pagination and filters."""
    query = (
        select(Receipt)
        .where(Receipt.user_id == current_user.id)
        .options(selectinload(Receipt.items))
    )
    
    if supermarket:
        query = query.where(
            func.lower(Receipt.supermarket_name).contains(supermarket.lower())
        )
    if date_from:
        query = query.where(Receipt.purchase_date >= date_from)
    if date_to:
        query = query.where(Receipt.purchase_date <= date_to)
    
    # Get total count
    count_query = (
        select(func.count(Receipt.id))
        .where(Receipt.user_id == current_user.id)
    )
    if supermarket:
        count_query = count_query.where(
            func.lower(Receipt.supermarket_name).contains(supermarket.lower())
        )
    if date_from:
        count_query = count_query.where(Receipt.purchase_date >= date_from)
    if date_to:
        count_query = count_query.where(Receipt.purchase_date <= date_to)
    
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Apply pagination and sorting
    offset = (page - 1) * page_size
    query = query.order_by(Receipt.purchase_date.desc()).offset(offset).limit(page_size)
    
    result = await db.execute(query)
    receipts = result.scalars().all()
    
    total_pages = (total + page_size - 1) // page_size if total > 0 else 0
    
    return ReceiptListResponse(
        receipts=[ReceiptResponse.model_validate(r) for r in receipts],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.post("", response_model=ReceiptResponse, status_code=status.HTTP_201_CREATED)
async def create_receipt(
    receipt_data: ReceiptCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new receipt with items (manual entry)."""
    # Calculate total from items
    total_amount = sum(item.price * item.quantity for item in receipt_data.items)
    
    # Create receipt
    receipt = Receipt(
        user_id=current_user.id,
        supermarket_name=receipt_data.supermarket_name,
        purchase_date=receipt_data.purchase_date,
        total_amount=total_amount,
        currency=receipt_data.currency,
        notes=receipt_data.notes,
    )
    db.add(receipt)
    await db.flush()
    
    # Create items
    for item_data in receipt_data.items:
        item = Item(
            receipt_id=receipt.id,
            name=item_data.name,
            brand=item_data.brand,
            price=item_data.price,
            quantity=item_data.quantity,
            unit=item_data.unit,
        )
        db.add(item)
    
    await db.commit()
    
    # Reload with items
    result = await db.execute(
        select(Receipt)
        .where(Receipt.id == receipt.id)
        .options(selectinload(Receipt.items))
    )
    receipt = result.scalar_one()
    
    return ReceiptResponse.model_validate(receipt)


@router.post("/ocr", response_model=OCRReceiptData)
async def upload_receipt_ocr(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """Upload receipt image for OCR processing."""
    # Validate file type
    allowed_types = [
        "image/jpeg", 
        "image/png", 
        "image/jpg", 
        "image/webp",
        "image/heic",
        "image/heif",
        "application/octet-stream",  # Some browsers send this for HEIC
    ]
    if file.content_type and file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type '{file.content_type}'. Allowed: JPEG, PNG, WebP, HEIC"
        )
    
    # Validate file size
    content = await file.read()
    if len(content) > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Max size: {settings.MAX_UPLOAD_SIZE // 1024 // 1024}MB"
        )
    
    # Save file temporarily
    upload_dir = settings.UPLOAD_DIR
    os.makedirs(upload_dir, exist_ok=True)
    
    file_ext = file.filename.split(".")[-1] if file.filename else "jpg"
    temp_filename = f"{uuid.uuid4()}.{file_ext}"
    temp_path = os.path.join(upload_dir, temp_filename)
    
    try:
        with open(temp_path, "wb") as f:
            f.write(content)
        
        # Process with OCR
        ocr_result = await ocr_service.extract_from_image(temp_path)
        
        return ocr_result
    
    finally:
        # Clean up temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)


@router.get("/{receipt_id}", response_model=ReceiptResponse)
async def get_receipt(
    receipt_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific receipt by ID."""
    result = await db.execute(
        select(Receipt)
        .where(Receipt.id == receipt_id, Receipt.user_id == current_user.id)
        .options(selectinload(Receipt.items))
    )
    receipt = result.scalar_one_or_none()
    
    if not receipt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Receipt not found"
        )
    
    return ReceiptResponse.model_validate(receipt)


@router.put("/{receipt_id}", response_model=ReceiptResponse)
async def update_receipt(
    receipt_id: str,
    update_data: ReceiptUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a receipt."""
    result = await db.execute(
        select(Receipt)
        .where(Receipt.id == receipt_id, Receipt.user_id == current_user.id)
        .options(selectinload(Receipt.items))
    )
    receipt = result.scalar_one_or_none()
    
    if not receipt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Receipt not found"
        )
    
    # Update fields
    if update_data.supermarket_name is not None:
        receipt.supermarket_name = update_data.supermarket_name
    if update_data.purchase_date is not None:
        receipt.purchase_date = update_data.purchase_date
    if update_data.currency is not None:
        receipt.currency = update_data.currency
    if update_data.notes is not None:
        receipt.notes = update_data.notes
    
    await db.commit()
    await db.refresh(receipt)
    
    return ReceiptResponse.model_validate(receipt)


@router.delete("/{receipt_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_receipt(
    receipt_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a receipt and all its items."""
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
    
    await db.delete(receipt)
    await db.commit()
