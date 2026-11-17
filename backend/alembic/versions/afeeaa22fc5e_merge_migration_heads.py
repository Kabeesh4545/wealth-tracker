"""merge migration heads

Revision ID: afeeaa22fc5e
Revises: 40caa0ac7371, e78a990021
Create Date: 2026-09-17 11:16:09.479167

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'afeeaa22fc5e'
down_revision: Union[str, Sequence[str], None] = ('40caa0ac7371', 'e78a990021')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
