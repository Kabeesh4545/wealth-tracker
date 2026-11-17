"""Add goal contribution tracking

Revision ID: b78c994653cb
Revises: 702311c20282
Create Date: 2026-08-19 14:43:02.433990

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'b78c994653cb'
down_revision: Union[str, Sequence[str], None] = '702311c20282'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. Create goal_contributions table
    op.create_table(
        'goal_contributions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('goal_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('amount', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('contribution_date', sa.Date(), nullable=False),
        sa.Column('description', sa.String(length=200), nullable=True),
        sa.Column('source', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint('amount > 0', name='check_contribution_amount_positive'),
        sa.ForeignKeyConstraint(['goal_id'], ['financial_goals.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_goal_contributions_contribution_date'), 'goal_contributions', ['contribution_date'], unique=False)
    op.create_index(op.f('ix_goal_contributions_goal_id'), 'goal_contributions', ['goal_id'], unique=False)
    op.create_index(op.f('ix_goal_contributions_id'), 'goal_contributions', ['id'], unique=False)
    op.create_index(op.f('ix_goal_contributions_user_id'), 'goal_contributions', ['user_id'], unique=False)
    
    # 2. Alter column types for target_amount and current_amount in financial_goals
    with op.batch_alter_table('financial_goals', schema=None) as batch_op:
        batch_op.alter_column('target_amount',
               existing_type=sa.FLOAT(),
               type_=sa.Numeric(precision=12, scale=2),
               existing_nullable=False)
        batch_op.alter_column('current_amount',
               existing_type=sa.FLOAT(),
               type_=sa.Numeric(precision=12, scale=2),
               existing_nullable=False)

def downgrade() -> None:
    with op.batch_alter_table('financial_goals', schema=None) as batch_op:
        batch_op.alter_column('current_amount',
               existing_type=sa.Numeric(precision=12, scale=2),
               type_=sa.FLOAT(),
               existing_nullable=False)
        batch_op.alter_column('target_amount',
               existing_type=sa.Numeric(precision=12, scale=2),
               type_=sa.FLOAT(),
               existing_nullable=False)
               
    op.drop_index(op.f('ix_goal_contributions_user_id'), table_name='goal_contributions')
    op.drop_index(op.f('ix_goal_contributions_id'), table_name='goal_contributions')
    op.drop_index(op.f('ix_goal_contributions_goal_id'), table_name='goal_contributions')
    op.drop_index(op.f('ix_goal_contributions_contribution_date'), table_name='goal_contributions')
    op.drop_table('goal_contributions')
