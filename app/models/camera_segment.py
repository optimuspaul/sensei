from shared import *

class CameraSegment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    classroom_id = db.Column(db.Integer, nullable=True)
    s3_folder_name = db.Column(db.String, nullable=False)
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime)
    sensor1_id = db.Column(db.Integer, nullable=False)
    sensor2_id = db.Column(db.Integer, nullable=False)

    def __init__(self, classroom_id, s3_folder_name, start_time, end_time, sensor1_id, sensor2_id):
        self.classroom_id = classroom_id
        self.s3_folder_name = s3_folder_name
        self.start_time = start_time
        self.end_time = end_time
        self.sensor1_id = sensor1_id
        self.sensor2_id = sensor2_id

    def as_dict(self):
       return dict(
         classroom_id=self.classroom_id,
         s3_folder_name=self.s3_folder_name,
         start_time=self.start_time,
         end_time=self.end_time,
         sensor1_id=self.sensor1_id,
         sensor2_id=self.sensor2_id)
