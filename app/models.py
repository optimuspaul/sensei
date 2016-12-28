import dateutil.parser
import enum
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

# Raw proximity event
class ProximityEvent(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    classroom_id = db.Column(db.Integer, nullable=False)
    local_id = db.Column(db.Integer, nullable=False)
    remote_id = db.Column(db.Integer, nullable=False)
    observed_at = db.Column(db.DateTime, nullable=False)
    rssi = db.Column(db.Float)

    def __init__(self, classroom_id, local_id, remote_id, observed_at, rssi):
        self.classroom_id = classroom_id
        self.local_id = local_id
        self.remote_id = remote_id
        self.observed_at = dateutil.parser.parse(observed_at)
        self.rssi = rssi

# Sensor mapping
class MappingType(enum.Enum):
    student = "student"
    teacher = "teacher"
    area = "area"
    material = "material"

class SensorMapping(db.Model):
    __tablename__ = 'sensor_mappings'
    id = db.Column(db.Integer, primary_key=True)
    classroom_id = db.Column(db.Integer, nullable=False)
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime)
    sensor_id = db.Column(db.Integer, nullable=False)
    mapping_type = db.Column(db.Enum(MappingType), nullable=False)
    target_id = db.Column(db.Integer, nullable=False)

    def __init__(self, classroom_id, sensor_id, start_time, end_time, mapping_type, target_id):
        self.classroom_id = classroom_id
        self.sensor_id = sensor_id
        self.start_time = start_time
        self.end_time = end_time
        self.mapping_type = mapping_type
        self.target_id = target_id

    def as_dict(self):
       return dict(
         classroom_id=self.classroom_id,
         sensor_id=self.sensor_id,
         start_time=self.start_time,
         end_time=self.end_time,
         mapping_type=self.mapping_type.name,
         target_id=self.target_id)

# Classroom areas
class Area(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    classroom_id = db.Column(db.Integer, nullable=False)
    name = db.Column(db.String, nullable=False)

    def __init__(self, classroom_id, name):
        self.classroom_id = classroom_id
        self.name = name

    def as_dict(self):
       return dict(
         classroom_id=self.classroom_id,
         id=self.id,
         name=self.name)
