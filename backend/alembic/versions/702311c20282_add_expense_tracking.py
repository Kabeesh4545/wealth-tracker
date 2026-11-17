"""Add expense tracking

Revision ID: 702311c20282
Revises: 42ec7bd833e0
Create Date: 2026-08-18 21:42:00.687817

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '702311c20282'
down_revision: Union[str, Sequence[str], None] = '42ec7bd833e0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. Rename existing 'expenses' table to 'planned_expenses'
    op.rename_table('expenses', 'planned_expenses')
    
    # 2. Drop the old index on renamed table to prevent SQLite name clashes
    op.drop_index('ix_expenses_id', table_name='planned_expenses')
    
    # 3. Re-create index on renamed table with new index name
    op.create_index(op.f('ix_planned_expenses_id'), 'planned_expenses', ['id'], unique=False)
    
    # 4. Create the new 'expenses' table for transaction tracking
    op.create_table('expenses',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('amount', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('category', sa.String(length=50), nullable=False),
        sa.Column('subcategory', sa.String(length=50), nullable=False),
        sa.Column('expense_date', sa.Date(), nullable=False),
        sa.Column('description', sa.String(length=200), nullable=True),
        sa.Column('payment_method', sa.String(length=50), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_expenses_id'), 'expenses', ['id'], unique=False)
    op.create_index(op.f('ix_expenses_user_id'), 'expenses', ['user_id'], unique=False)
    op.create_index(op.f('ix_expenses_category'), 'expenses', ['category'], unique=False)
    op.create_index(op.f('ix_expenses_expense_date'), 'expenses', ['expense_date'], unique=False)
    op.create_check_constraint('check_expense_amount_positive', 'expenses', 'amount > 0')

def downgrade() -> None:
    op.drop_table('expenses')
    op.rename_table('planned_expenses', 'expenses')
    op.create_index('ix_expenses_id', 'expenses', ['id'], unique=False)
