from shared import *

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
