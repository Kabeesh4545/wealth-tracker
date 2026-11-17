from datetime import datetime
from decimal import Decimal
from sqlalchemy import String, Integer, Float, Numeric, ForeignKey, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.connection import Base

class Loan(Base):
    __tablename__ = "loans"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    
    loan_type: Mapped[str] = mapped_column(String(100))
    outstanding_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0.00"))
    monthly_emi: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0.00"))
    interest_rate: Mapped[float] = mapped_column(Float, default=0.0)
    remaining_tenure_months: Mapped[int] = mapped_column(Integer)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship("User", back_populates="loans")
