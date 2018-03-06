import dateutil.parser
from shared import *
from sqlalchemy.dialects.postgresql import insert
from sensor_mapping import MappingType
import pytz

# Raw radio observation
class EntityLocation(db.Model):
    classroom_id = db.Column(db.Integer, nullable=False, primary_key=True)
    timestamp = db.Column(db.DateTime, nullable=False, primary_key=True)
    entity_id = db.Column(db.Integer, nullable=False, primary_key=True)
    entity_type = db.Column(db.Enum(MappingType), nullable=False, primary_key=True)
    x = db.Column(db.Float)
    xStdDev = db.Column(db.Float)
    y = db.Column(db.Float)
    yStdDev = db.Column(db.Float)

    db.Index("location_obs_unique_idx", classroom_id, timestamp, entity_id, entity_type, unique=True)

    def __init__(self, classroom_id, timestamp, entity_id, entity_type, x, xStdDev, y, yStdDev):
        self.classroom_id = classroom_id
        self.timestamp = dateutil.parser.parse(timestamp)
        if self.timestamp.tzinfo != None:
            self.timestamp = self.timestamp.astimezone(pytz.utc)
        self.entity_id = entity_id
        self.entity_type = entity_type
        self.x = x
        self.xStdDev = xStdDev
        self.y = y
        self.yStdDev = yStdDev

    def as_dict(self):
       return dict(
         classroom_id=self.classroom_id,
         timestamp=self.timestamp.isoformat(),
         entity_id=self.entity_id,
         entity_type=self.entity_type,
         x=self.x,
         xStdDev=self.xStdDev,
         y=self.y,
         yStdDev=self.yStdDev)

    def as_dict_for_web_resource(self):
       return dict(
         classroom_id=self.classroom_id,
         timestamp=self.timestamp.isoformat(),
         entity_id=self.entity_id,
         entity_type=self.entity_type.value,
         x=self.x,
         xStdDev=self.xStdDev,
         y=self.y,
         yStdDev=self.yStdDev)

    @staticmethod
    def bulk_store(obs):
        insert_stmt = insert(EntityLocation.__table__)

        obs_values = [o.as_dict() for o in obs]

        do_nothing_stmt = insert_stmt.on_conflict_do_nothing(
            index_elements=['classroom_id', 'timestamp', 'entity_id', 'entity_type']
        )

        db.session.execute(do_nothing_stmt, obs_values)
        db.session.commit()
