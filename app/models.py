import dateutil.parser
import enum, json
from flask_sqlalchemy import SQLAlchemy
from tc_service import TCService

db = SQLAlchemy()

# User
class User(object):
    def __init__(self, userinfo):
        self.id = userinfo['id']
        self.first_name = userinfo['first_name']
        self.last_name = userinfo['last_name']
        self.email = userinfo['email']
        self.api_token = userinfo['api_token']
        self.school_id = userinfo['school_id']

    def as_dict(self):
       return dict(
         id=self.id,
         first_name=self.first_name,
         last_name=self.last_name,
         email=self.email,
         api_token=self.api_token,
         school_id=self.school_id)


# Raw radio observation
class RadioObservation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    classroom_id = db.Column(db.Integer, nullable=False)
    local_id = db.Column(db.Integer, nullable=False)
    remote_id = db.Column(db.Integer, nullable=False)
    observed_at = db.Column(db.DateTime, nullable=False)
    rssi = db.Column(db.Float)

    db.Index("local_idx_by_time", "observed_at", "local_id")
    db.Index("remote_idx_by_time", "observed_at", "local_id")

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
    entity_type = db.Column(db.Enum(MappingType), nullable=False)
    entity_id = db.Column(db.Integer, nullable=False)

    def __init__(self, classroom_id, sensor_id, start_time, end_time, entity_type, entity_id):
        self.classroom_id = classroom_id
        self.sensor_id = sensor_id
        self.start_time = start_time
        self.end_time = end_time
        self.entity_type = entity_type
        self.entity_id = entity_id

    def as_dict(self):
       return dict(
         classroom_id=self.classroom_id,
         sensor_id=self.sensor_id,
         start_time=self.start_time,
         end_time=self.end_time,
         entity_type=self.entity_type.name,
         entity_id=self.entity_id)

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

# Classroom Material
class Material(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    classroom_id = db.Column(db.Integer, nullable=False)
    name = db.Column(db.String, nullable=False)
    lesson_id = db.Column(db.Integer, nullable=True)

    def __init__(self, classroom_id, name, lesson_id=None):
        self.classroom_id = classroom_id
        self.name = name
        self.lesson_id = lesson_id

    def as_dict(self):
       return dict(
         classroom_id=self.classroom_id,
         id=self.id,
         name=self.name,
         lesson_id=self.lesson_id)

# Classrooms (these are not in the database, but are in TC)
class Classroom(object):

    def __init__(self, attrs):
        self.id = attrs.get('id')
        self.name = attrs.get('name')
        self.lesson_set_id = attrs.get('lesson_set_id')

    @staticmethod
    def get_for_user(tc_svc, user):
        body = tc_svc.request('classrooms', user=user)
        return [Classroom(c) for c in json.loads(body)]

    def as_dict(self):
        return dict(
            id=self.id,
            name=self.name,
            lesson_set_id=self.lesson_set_id)
