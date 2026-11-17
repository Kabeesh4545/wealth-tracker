"""add data sources provenance and refresh logs

Revision ID: e78a990021
Revises: b78c994653cb
Create Date: 2026-09-07 15:47:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'e78a990021'
down_revision = 'b78c994653cb'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # 1. Create data_sources table
    op.create_table(
        'data_sources',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('source_key', sa.String(length=100), nullable=False),
        sa.Column('name', sa.String(length=150), nullable=False),
        sa.Column('category', sa.String(length=100), nullable=False),
        sa.Column('source_type', sa.String(length=50), nullable=False),
        sa.Column('source_url', sa.String(length=255), nullable=True),
        sa.Column('refresh_frequency_hours', sa.Integer(), nullable=True, server_default='24'),
        sa.Column('is_active', sa.Boolean(), nullable=True, server_default='true'),
        sa.Column('last_refreshed_at', sa.DateTime(), nullable=True),
        sa.Column('last_status', sa.String(length=50), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_data_sources_id'), 'data_sources', ['id'], unique=False)
    op.create_index(op.f('ix_data_sources_source_key'), 'data_sources', ['source_key'], unique=True)
    op.create_index(op.f('ix_data_sources_category'), 'data_sources', ['category'], unique=False)

    # 2. Create data_refresh_logs table
    op.create_table(
        'data_refresh_logs',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('data_source_id', sa.Integer(), nullable=False),
        sa.Column('started_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('records_fetched', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('records_updated', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('records_rejected', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('error_message', sa.String(length=500), nullable=True),
        sa.ForeignKeyConstraint(['data_source_id'], ['data_sources.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_data_refresh_logs_id'), 'data_refresh_logs', ['id'], unique=False)
    op.create_index(op.f('ix_data_refresh_logs_data_source_id'), 'data_refresh_logs', ['data_source_id'], unique=False)

    # 3. Create investment_rates table
    op.create_table(
        'investment_rates',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('institution', sa.String(length=100), nullable=False),
        sa.Column('product_name', sa.String(length=100), nullable=False),
        sa.Column('tenure', sa.String(length=50), nullable=True),
        sa.Column('customer_category', sa.String(length=50), nullable=False, server_default='Regular'),
        sa.Column('rate_value', sa.Numeric(precision=6, scale=4), nullable=False),
        sa.Column('rate_classification', sa.String(length=50), nullable=False, server_default='CURRENT_RATE'),
        sa.Column('effective_from', sa.Date(), nullable=True),
        sa.Column('effective_until', sa.Date(), nullable=True),
        sa.Column('source_url', sa.String(length=255), nullable=True),
        sa.Column('retrieved_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('is_verified', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('freshness_status', sa.String(length=50), nullable=False, server_default='CURRENT'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_investment_rates_id'), 'investment_rates', ['id'], unique=False)
    op.create_index(op.f('ix_investment_rates_institution'), 'investment_rates', ['institution'], unique=False)
    op.create_index(op.f('ix_investment_rates_product_name'), 'investment_rates', ['product_name'], unique=False)

    # 4. Add provenance and freshness columns to local_costs
    with op.batch_alter_table('local_costs') as batch_op:
        batch_op.add_column(sa.Column('data_type', sa.String(length=50), nullable=True, server_default='BENCHMARK'))
        batch_op.add_column(sa.Column('is_verified', sa.Boolean(), nullable=True, server_default='true'))
        batch_op.add_column(sa.Column('retrieved_at', sa.DateTime(), nullable=True, server_default=sa.text('CURRENT_TIMESTAMP')))
        batch_op.add_column(sa.Column('freshness_status', sa.String(length=50), nullable=True, server_default='RECENT'))

def downgrade() -> None:
    with op.batch_alter_table('local_costs') as batch_op:
        batch_op.drop_column('freshness_status')
        batch_op.drop_column('retrieved_at')
        batch_op.drop_column('is_verified')
        batch_op.drop_column('data_type')

    op.drop_index(op.f('ix_investment_rates_product_name'), table_name='investment_rates')
    op.drop_index(op.f('ix_investment_rates_institution'), table_name='investment_rates')
    op.drop_index(op.f('ix_investment_rates_id'), table_name='investment_rates')
    op.drop_table('investment_rates')

    op.drop_index(op.f('ix_data_refresh_logs_data_source_id'), table_name='data_refresh_logs')
    op.drop_index(op.f('ix_data_refresh_logs_id'), table_name='data_refresh_logs')
    op.drop_table('data_refresh_logs')

    op.drop_index(op.f('ix_data_sources_category'), table_name='data_sources')
    op.drop_index(op.f('ix_data_sources_source_key'), table_name='data_sources')
    op.drop_index(op.f('ix_data_sources_id'), table_name='data_sources')
    op.drop_table('data_sources')
