from datetime import datetime, date
from decimal import Decimal
from typing import Optional
from sqlalchemy import String, Integer, Numeric, Boolean, DateTime, Date, ForeignKey, func, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.connection import Base

class DataSource(Base):
    __tablename__ = "data_sources"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    source_key: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False, index=True) # 'local_cost' | 'economic' | 'investment'
    source_type: Mapped[str] = mapped_column(String(50), nullable=False) # 'API' | 'GOVT_FEED' | 'SCRAPER' | 'MANUAL_IMPORT'
    source_url: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    refresh_frequency_hours: Mapped[int] = mapped_column(Integer, default=24)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    last_refreshed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    last_status: Mapped[Optional[str]] = mapped_column(String(50), nullable=True) # 'SUCCESS' | 'FAILED' | 'PARTIAL'
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), onupdate=func.now())

    refresh_logs: Mapped[list["DataRefreshLog"]] = relationship(
        "DataRefreshLog", back_populates="data_source", cascade="all, delete-orphan"
    )

class DataRefreshLog(Base):
    __tablename__ = "data_refresh_logs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    data_source_id: Mapped[int] = mapped_column(
        ForeignKey("data_sources.id", ondelete="CASCADE"), nullable=False, index=True
    )
    started_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), nullable=False)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False) # 'SUCCESS' | 'FAILED' | 'PARTIAL'
    records_fetched: Mapped[int] = mapped_column(Integer, default=0)
    records_updated: Mapped[int] = mapped_column(Integer, default=0)
    records_rejected: Mapped[int] = mapped_column(Integer, default=0)
    error_message: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    data_source: Mapped["DataSource"] = relationship("DataSource", back_populates="refresh_logs")

class InvestmentRate(Base):
    __tablename__ = "investment_rates"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    institution: Mapped[str] = mapped_column(String(100), nullable=False, index=True) # 'RBI' | 'SBI' | 'HDFC' | 'India Post'
    product_name: Mapped[str] = mapped_column(String(100), nullable=False, index=True) # 'PPF' | 'Bank FD' | 'Senior Citizen Savings Scheme'
    tenure: Mapped[Optional[str]] = mapped_column(String(50), nullable=True) # '1 Year' | '5 Years'
    customer_category: Mapped[str] = mapped_column(String(50), default="Regular") # 'Regular' | 'Senior Citizen'
    
    rate_value: Mapped[Decimal] = mapped_column(Numeric(6, 4), nullable=False) # e.g. 0.0710 for 7.10%
    rate_classification: Mapped[str] = mapped_column(String(50), nullable=False, default="CURRENT_RATE") # 'CURRENT_RATE' | 'HISTORICAL_PERFORMANCE' | 'EDUCATIONAL_INFO'
    
    effective_from: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    effective_until: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    source_url: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    retrieved_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    is_verified: Mapped[bool] = mapped_column(Boolean, default=True)
    freshness_status: Mapped[str] = mapped_column(String(50), default="CURRENT") # 'CURRENT' | 'RECENT' | 'STALE' | 'UNAVAILABLE'

    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), onupdate=func.now())
