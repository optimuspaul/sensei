import dateutil.parser
from shared import *

# Raw radio observation
class RadioObservation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    classroom_id = db.Column(db.Integer, nullable=False)
    local_id = db.Column(db.Integer, nullable=False)
    remote_id = db.Column(db.Integer, nullable=False)
    observed_at = db.Column(db.DateTime, nullable=False)
    relationship_id = db.Column(db.Integer,  db.ForeignKey('entity_relationship.id'), nullable=False)
    relationship = db.relationship("EntityRelationship")
    rssi = db.Column(db.Float)

    db.Index("main_idx", "classroom_id", "observed_at", "relationship_id")

    def __init__(self, classroom_id, local_id, remote_id,
                 observed_at, relationship, rssi):
        self.classroom_id = classroom_id
        self.local_id = local_id
        self.remote_id = remote_id
        self.observed_at = dateutil.parser.parse(observed_at)
        self.relationship = relationship
        self.rssi = rssi
