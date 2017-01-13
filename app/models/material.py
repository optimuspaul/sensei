from shared import *

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
