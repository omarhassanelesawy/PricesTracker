"""User model for authentication and user management."""

import uuid
from datetime import datetime
from sqlalchemy import String, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.database import Base


class CurrencyType(str, enum.Enum):
    """Supported currency types."""
    USD = "USD"
    EGP = "EGP"
    EUR = "EUR"
    GBP = "GBP"
    SAR = "SAR"
    AED = "AED"


class User(Base):
    """User model for storing user information."""
    
    __tablename__ = "users"
    
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )
    password_hash: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )
    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    currency: Mapped[str] = mapped_column(
        String(10),
        default=CurrencyType.USD.value,
        nullable=False,
    )
    
    # OAuth fields
    oauth_provider: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )
    oauth_id: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )
    
    # Relationships
    receipts: Mapped[list["Receipt"]] = relationship(
        "Receipt",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    
    def __repr__(self) -> str:
        return f"<User {self.email}>"
