from datetime import datetime
from decimal import Decimal
from sqlalchemy import String, Integer, Numeric, ForeignKey, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.connection import Base
from typing import Optional

class FinancialProfile(Base):
    __tablename__ = "financial_profiles"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    
    age: Mapped[int] = mapped_column(Integer)
    city: Mapped[str] = mapped_column(String(100))
    employment_type: Mapped[str] = mapped_column(String(100))
    family_members: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    dependents: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    monthly_salary: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0.00"))
    other_income: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0.00"))
    variable_income: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0.00"))

    housing_type: Mapped[str] = mapped_column(String(100)) # 'Rent' | 'Own House' | 'Living With Family' | 'Other'
    rent_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0.00"))
    maintenance: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0.00"))
    has_home_loan: Mapped[Optional[str]] = mapped_column(String(10), nullable=True) # 'Yes' | 'No'
    home_loan_emi: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0.00"))
    household_contribution: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0.00"))
    other_housing_expenses: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0.00"))

    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship("User", back_populates="financial_profile")
