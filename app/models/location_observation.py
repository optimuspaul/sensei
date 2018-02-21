import dateutil.parser
from shared import *
from sqlalchemy.dialects.postgresql import insert
from sensor_mapping import MappingType
import pytz

# Raw radio observation
class LocationObservation(db.Model):
    classroom_id = db.Column(db.Integer, nullable=False, primary_key=True)
    observed_at = db.Column(db.DateTime, nullable=False, primary_key=True)
    entity_id = db.Column(db.Integer, nullable=False, primary_key=True)
    entity_type = db.Column(db.Enum(MappingType), nullable=False, primary_key=True)
    x_coord = db.Column(db.Float)
    y_coord = db.Column(db.Float)
    strength = db.Column(db.Float)

    db.Index("location_obs_unique_idx", classroom_id, observed_at, entity_id, entity_type, unique=True)

    def __init__(self, classroom_id, observed_at, entity_id, entity_type, x_coord, y_coord, strength):
        self.classroom_id = classroom_id
        self.observed_at = dateutil.parser.parse(observed_at)
        if self.observed_at.tzinfo != None:
            self.observed_at = self.observed_at.astimezone(pytz.utc)
        self.entity_id = entity_id
        self.entity_type = entity_type
        self.x_coord = x_coord
        self.y_coord = y_coord
        self.strength = strength

    def as_dict(self):
       return dict(
         classroom_id=self.classroom_id,
         observed_at=self.observed_at.isoformat(),
         entity_id=self.entity_id,
         entity_type=self.entity_type,
         x_coord=self.x_coord,
         y_coord=self.y_coord,
         strength=self.strength)

    def as_dict_for_web_resource(self):
       return dict(
         classroom_id=self.classroom_id,
         observed_at=self.observed_at.isoformat(),
         entity_id=self.entity_id,
         entity_type=self.entity_type.value,
         x_coord=self.x_coord,
         y_coord=self.y_coord,
         strength=self.strength)

    @staticmethod
    def bulk_store(obs):
        insert_stmt = insert(LocationObservation.__table__)

        obs_values = [o.as_dict() for o in obs]

        do_nothing_stmt = insert_stmt.on_conflict_do_nothing(
            index_elements=['classroom_id', 'observed_at', 'entity_id', 'entity_type']
        )

        db.session.execute(do_nothing_stmt, obs_values)
        db.session.commit()
