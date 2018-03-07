from shared import *

# Classroom areas
class Area(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    classroom_id = db.Column(db.Integer, nullable=False)
    name = db.Column(db.String, nullable=False)
    x_position = db.Column(db.Float)
    y_position = db.Column(db.Float)
    z_position = db.Column(db.Float)

    def __init__(self, classroom_id, name, x_position=None, y_position=None, z_position=None):
        self.classroom_id = classroom_id
        self.name = name
        self.x_position = x_position
        self.y_position = y_position
        self.z_position = z_position

    def as_dict(self):
       return dict(
         classroom_id=self.classroom_id,
         id=self.id,
         name=self.name,
         x_position=self.x_position,
         y_position=self.y_position,
         z_position=self.z_position)
