"""empty message

Revision ID: 0745219a2583
Revises:
Create Date: 2017-01-28 19:11:42.308339

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0745219a2583'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.drop_constraint("radio_observation_pkey", "radio_observation")
    op.create_primary_key("radio_observation_pkey", "radio_observation",
            ["classroom_id", "observed_at", "relationship_id"]
    )
    op.drop_column('radio_observation', 'remote_id')
    op.drop_column('radio_observation', 'id')
    op.drop_column('radio_observation', 'local_id')


def downgrade():
    op.add_column('radio_observation', sa.Column('local_id', sa.INTEGER(), autoincrement=False, nullable=False))
    op.add_column('radio_observation', sa.Column('id', sa.INTEGER(), nullable=False))
    op.add_column('radio_observation', sa.Column('remote_id', sa.INTEGER(), autoincrement=False, nullable=False))
    op.drop_constraint("radio_observation_pkey", "radio_observation")
    op.create_primary_key("radio_observation_pkey", "radio_observation",
            ["id"]
    )
