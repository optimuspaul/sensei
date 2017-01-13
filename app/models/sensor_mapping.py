from shared import *
import enum

# Sensor mapping
class MappingType(enum.Enum):
    child = "child"
    teacher = "teacher"
    area = "area"
    material = "material"

class SensorMapping(db.Model):
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
