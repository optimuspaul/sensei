import dateutil.parser
import enum
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

# User table to handle login
class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.Text)
    password = db.Column(db.Text)

    def __init__(self, username, password):
        self.username = username
        self.password = password

    def __repr__(self):
        return self.username

# Raw proximity event
class SensorProximityEvent(db.Model):
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
class SensorType(enum.Enum):
    child = "child"
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
    sensor_type = db.Column(db.Enum(SensorType), nullable=False)
    target_id = db.Column(db.Integer, nullable=False)
