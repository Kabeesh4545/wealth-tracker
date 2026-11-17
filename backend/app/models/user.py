from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.connection import Base
from typing import List, Optional

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    full_name: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships (uselist=False for 1:1)
    financial_profile: Mapped[Optional["FinancialProfile"]] = relationship(
        "FinancialProfile", back_populates="user", cascade="all, delete-orphan", uselist=False
    )
    savings: Mapped[Optional["Saving"]] = relationship(
        "Saving", back_populates="user", cascade="all, delete-orphan", uselist=False
    )
    investment_profile: Mapped[Optional["InvestmentProfile"]] = relationship(
        "InvestmentProfile", back_populates="user", cascade="all, delete-orphan", uselist=False
    )
    loans: Mapped[List["Loan"]] = relationship(
        "Loan", back_populates="user", cascade="all, delete-orphan"
    )
    planned_expenses: Mapped[List["PlannedExpense"]] = relationship(
        "PlannedExpense", back_populates="user", cascade="all, delete-orphan"
    )
    expenses: Mapped[List["Expense"]] = relationship(
        "Expense", back_populates="user", cascade="all, delete-orphan"
    )
    investments: Mapped[List["Investment"]] = relationship(
        "Investment", back_populates="user", cascade="all, delete-orphan"
    )
    goals: Mapped[List["FinancialGoal"]] = relationship(
        "FinancialGoal", back_populates="user", cascade="all, delete-orphan"
    )
    goal_contributions: Mapped[List["GoalContribution"]] = relationship(
        "GoalContribution", back_populates="user", cascade="all, delete-orphan"
    )
