from datetime import datetime
from sqlalchemy import String, ForeignKey, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.connection import Base

class InvestmentProfile(Base):
    __tablename__ = "investment_profiles"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    
    experience: Mapped[str] = mapped_column(String(100)) # 'No Experience' | 'Beginner' etc.
    time_horizon: Mapped[str] = mapped_column(String(100))
    risk_tolerance: Mapped[str] = mapped_column(String(100))
    primary_preference: Mapped[str] = mapped_column(String(100))

    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship("User", back_populates="investment_profile")
