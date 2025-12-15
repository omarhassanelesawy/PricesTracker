"""OCR service for extracting receipt data from images using Google Gemini API."""

import re
import json
from datetime import date
from decimal import Decimal, InvalidOperation
from typing import Optional, List
from pathlib import Path
import base64

import google.generativeai as genai

from app.config import settings
from app.schemas.item import ItemCreate
from app.schemas.receipt import OCRReceiptData


class OCRService:
    """Service for OCR processing of receipt images using Google Gemini."""
    
    def __init__(self):
        self.model = None
        self._init_client()
        
    def _init_client(self):
        """Initialize Google Gemini client."""
        try:
            if settings.GEMINI_API_KEY:
                genai.configure(api_key=settings.GEMINI_API_KEY)
                # Use Gemini 1.5 Flash for fast, accurate image processing (free tier)
                self.model = genai.GenerativeModel('gemini-2.5-flash')
            else:
                print("Warning: GEMINI_API_KEY not set. OCR functionality will be disabled.")
                self.model = None
        except Exception as e:
            print(f"Warning: Could not initialize Gemini client: {e}")
            self.model = None
    
    async def extract_from_image(self, image_path: str) -> OCRReceiptData:
        """Extract receipt data from an image file using Gemini."""
        if not self.model:
            raise ValueError(
                "Gemini API not configured. Please set GEMINI_API_KEY in environment."
            )
        
        # Read and encode image
        with open(image_path, 'rb') as f:
            image_data = f.read()
        
        return await self._process_image(image_data, image_path)
    
    async def extract_from_base64(self, image_base64: str, mime_type: str = "image/jpeg") -> OCRReceiptData:
        """Extract receipt data from a base64-encoded image."""
        if not self.model:
            raise ValueError(
                "Gemini API not configured. Please set GEMINI_API_KEY in environment."
            )
        
        image_data = base64.b64decode(image_base64)
        return await self._process_image(image_data, mime_type=mime_type)
    
    async def _process_image(self, image_data: bytes, image_path: str = None, mime_type: str = None) -> OCRReceiptData:
        """Process image with Gemini and extract receipt data."""
        
        # Determine mime type
        if mime_type is None and image_path:
            ext = Path(image_path).suffix.lower()
            mime_types = {
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.webp': 'image/webp',
            }
            mime_type = mime_types.get(ext, 'image/jpeg')
        
        # Create image part for Gemini
        image_part = {
            "mime_type": mime_type or "image/jpeg",
            "data": image_data
        }
        
        # Prompt for structured receipt extraction
        prompt = """Analyze this receipt image and extract the following information in JSON format:

{
    "supermarket_name": "Name of the store/supermarket",
    "purchase_date": "YYYY-MM-DD format if visible, null otherwise",
    "currency": "Currency code like EGP, USD, EUR if visible",
    "items": [
        {
            "name": "Item name",
            "brand": "Brand name if visible, null otherwise",
            "price": 0.00,
            "quantity": 1.0,
            "unit": "kg, L, pcs, etc if visible, null otherwise",
            "unit_price": 0.00
        }
    ],
    "total_amount": 0.00,
    "raw_text": "Full extracted text from the receipt"
}

CRITICAL - Handling Weighted/Bulk Items:
Many receipts show items sold by weight (per kg, per lb) or by volume (per L) with THREE pieces of information:
1. UNIT PRICE - The price per kg/lb/L (e.g., "150.00/kg")
2. QUANTITY - The amount purchased (e.g., "0.500 kg")  
3. PAID PRICE - The actual amount paid = unit_price × quantity (e.g., "75.00")

For the "price" field, ALWAYS use the PAID PRICE (the total amount charged for that item), NOT the unit price.
The "unit_price" field should contain the per-unit price (per kg, per L, etc.) if shown.
The "quantity" field should reflect the actual amount purchased (e.g., 0.5 for half a kg).

VALIDATION:
- The sum of all item "price" values should approximately equal the "total_amount" shown at the bottom of the receipt
- If your calculated sum doesn't match the receipt total, re-check your extraction of the "price" fields
- Common receipt formats:
  * "Item Name    150.00/KG    0.500    75.00" → price=75.00, unit_price=150.00, quantity=0.5
  * "Item Name    2 × 25.00    50.00" → price=50.00, quantity=2, unit_price=25.00

Other Important Notes:
- Extract ALL items you can see with their prices
- Prices should be numbers without currency symbols
- If information is not visible or unclear, use null
- For Arabic text, translate item names to English if possible
- Return ONLY valid JSON, no other text"""

        try:
            # Call Gemini API
            response = self.model.generate_content([prompt, image_part])
            
            # Parse response
            response_text = response.text.strip()
            
            # Clean up response - remove markdown code blocks if present
            if response_text.startswith('```'):
                lines = response_text.split('\n')
                # Remove first and last lines if they're code block markers
                if lines[0].startswith('```'):
                    lines = lines[1:]
                if lines and lines[-1].startswith('```'):
                    lines = lines[:-1]
                response_text = '\n'.join(lines)
            
            # Parse JSON
            data = json.loads(response_text)
            
            # Convert to OCRReceiptData
            items = []
            for item in data.get('items', []):
                try:
                    item_name = item.get('name', '').strip()
                    brand = item.get('brand', '').strip() if item.get('brand') else ''
                    
                    # Combine brand with item name if brand exists
                    if brand and brand.lower() not in item_name.lower():
                        item_name = f"{brand} - {item_name}"
                    
                    items.append(ItemCreate(
                        name=item_name,
                        brand=brand if brand else None,
                        price=Decimal(str(item.get('price', 0))),
                        quantity=Decimal(str(item.get('quantity', 1))),
                        unit=item.get('unit'),
                        unit_price=Decimal(str(item.get('unit_price'))) if item.get('unit_price') else None,
                    ))
                except (InvalidOperation, ValueError):
                    continue
            
            # Parse date
            purchase_date = None
            if data.get('purchase_date'):
                try:
                    from dateutil import parser
                    purchase_date = parser.parse(data['purchase_date']).date()
                except:
                    pass
            
            # Parse total
            total_amount = None
            if data.get('total_amount'):
                try:
                    total_amount = Decimal(str(data['total_amount']))
                except InvalidOperation:
                    pass
            
            return OCRReceiptData(
                supermarket_name=data.get('supermarket_name'),
                purchase_date=purchase_date,
                items=items,
                total_amount=total_amount,
                raw_text=data.get('raw_text', ''),
            )
            
        except json.JSONDecodeError as e:
            # If JSON parsing fails, try to extract what we can
            print(f"JSON parse error: {e}")
            return OCRReceiptData(
                supermarket_name=None,
                purchase_date=None,
                items=[],
                total_amount=None,
                raw_text=response_text if 'response_text' in locals() else "",
            )
        except Exception as e:
            print(f"Gemini API error: {e}")
            raise ValueError(f"Failed to process receipt: {str(e)}")


# Singleton instance
ocr_service = OCRService()
