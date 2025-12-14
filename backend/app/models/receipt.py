"""Receipt model for storing shopping receipts."""

import uuid
from datetime import datetime, date
from decimal import Decimal
from sqlalchemy import String, DateTime, Date, Numeric, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Receipt(Base):
    """Receipt model for storing shopping receipt information."""
    
    __tablename__ = "receipts"
    
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    supermarket_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        index=True,
    )
    purchase_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        index=True,
    )
    total_amount: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False,
    )
    currency: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
    )
    image_path: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )
    
    # Relationships
    user: Mapped["User"] = relationship(
        "User",
        back_populates="receipts",
    )
    items: Mapped[list["Item"]] = relationship(
        "Item",
        back_populates="receipt",
        cascade="all, delete-orphan",
    )
    
    def __repr__(self) -> str:
        return f"<Receipt {self.supermarket_name} - {self.purchase_date}>"
