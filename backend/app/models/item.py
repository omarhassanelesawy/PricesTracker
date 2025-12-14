"""Item model for storing individual grocery items."""

import uuid
from datetime import datetime
from decimal import Decimal
from sqlalchemy import String, DateTime, Numeric, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Item(Base):
    """Item model for storing individual items from receipts."""
    
    __tablename__ = "items"
    
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    receipt_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("receipts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        index=True,
    )
    brand: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
        index=True,
    )
    price: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False,
    )
    quantity: Mapped[Decimal] = mapped_column(
        Numeric(10, 3),
        default=Decimal("1"),
        nullable=False,
    )
    unit: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )
    
    # Relationships
    receipt: Mapped["Receipt"] = relationship(
        "Receipt",
        back_populates="items",
    )
    
    @property
    def unit_price(self) -> Decimal:
        """Calculate unit price based on quantity."""
        if self.quantity and self.quantity > 0:
            return self.price / self.quantity
        return self.price
    
    def __repr__(self) -> str:
        return f"<Item {self.name} - {self.price}>"
    
    __table_args__ = (
        Index('idx_item_name_brand', 'name', 'brand'),
    )
