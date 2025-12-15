"""Database connection and session management."""

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.config import settings


# Create async engine for SQLite
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    future=True,
)

# Create async session factory
async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """Base class for all database models."""
    pass


async def get_db() -> AsyncSession:
    """Dependency to get database session."""
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    """Initialize database tables and run migrations."""
    async with engine.begin() as conn:
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)
        
        # Run migrations for existing databases
        # Add unit_price column to items table if it doesn't exist
        try:
            # Check if column exists (SQLite specific)
            result = await conn.execute(
                text("PRAGMA table_info(items)")
            )
            columns = [row[1] for row in result.fetchall()]
            
            if "unit_price" not in columns:
                await conn.execute(
                    text("ALTER TABLE items ADD COLUMN unit_price NUMERIC(10, 2)")
                )
                print("Migration: Added unit_price column to items table")
        except Exception as e:
            # Table might not exist yet (fresh install), which is fine
            print(f"Migration check: {e}")
