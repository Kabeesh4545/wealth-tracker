from datetime import datetime
from sqlalchemy import String, Integer, Float, Boolean, DateTime, func, CheckConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column
from app.database.connection import Base
from typing import Optional

class LocalCost(Base):
    __tablename__ = "local_costs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    
    city: Mapped[str] = mapped_column(String(100), index=True)
    state: Mapped[str] = mapped_column(String(100))
    country: Mapped[str] = mapped_column(String(100))

    category: Mapped[str] = mapped_column(String(100), index=True)
    subcategory: Mapped[str] = mapped_column(String(100), index=True)

    min_cost: Mapped[float] = mapped_column(Float)
    typical_cost: Mapped[float] = mapped_column(Float)
    max_cost: Mapped[float] = mapped_column(Float)

    currency: Mapped[str] = mapped_column(String(10))
    unit: Mapped[str] = mapped_column(String(50), default="monthly")

    household_size_min: Mapped[int] = mapped_column(Integer)
    household_size_max: Mapped[int] = mapped_column(Integer)

    housing_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True) # e.g. '1 BHK', '2 BHK', '3 BHK', or null for general costs

    source: Mapped[str] = mapped_column(String(100))
    source_url: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    reference_month: Mapped[str] = mapped_column(String(10)) # Format YYYY-MM
    last_updated: Mapped[str] = mapped_column(String(50))
    data_confidence: Mapped[str] = mapped_column(String(20)) # 'high' | 'medium' | 'low'
    
    data_type: Mapped[str] = mapped_column(String(50), default="BENCHMARK") # 'BENCHMARK' | 'VERIFIED' | 'ESTIMATED' | 'STALE'
    is_verified: Mapped[bool] = mapped_column(Boolean, default=True)
    retrieved_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True, default=func.now())
    freshness_status: Mapped[str] = mapped_column(String(50), default="RECENT") # 'CURRENT' | 'RECENT' | 'STALE' | 'UNAVAILABLE'

    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), onupdate=func.now())

    __table_args__ = (
        CheckConstraint('min_cost >= 0', name='check_min_cost_positive'),
        CheckConstraint('typical_cost >= min_cost', name='check_typical_cost_gte_min'),
        CheckConstraint('max_cost >= typical_cost', name='check_max_cost_gte_typical'),
        CheckConstraint('household_size_min > 0', name='check_household_size_min_positive'),
        CheckConstraint('household_size_max >= household_size_min', name='check_household_size_max_gte_min'),
        CheckConstraint("currency != ''", name='check_currency_not_empty'),
        CheckConstraint("source != ''", name='check_source_not_empty'),
        CheckConstraint("length(reference_month) = 7", name='check_reference_month_length'),
        CheckConstraint("data_confidence IN ('high', 'medium', 'low')", name='check_data_confidence_valid'),
        Index(
            'idx_local_costs_unique',
            'city',
            'category',
            'subcategory',
            'household_size_min',
            'household_size_max',
            'housing_type',
            unique=True,
            postgresql_nulls_not_distinct=True
        ),
    )
