import dateutil.parser
from shared import *
from sqlalchemy.dialects.postgresql import insert
import pytz

# Raw radio observation
class RadioObservation(db.Model):
    classroom_id = db.Column(db.Integer, nullable=False, primary_key=True)
    observed_at = db.Column(db.DateTime, nullable=False, primary_key=True)
    relationship_id = db.Column(db.Integer,  db.ForeignKey('entity_relationship.id'), nullable=False, primary_key=True)
    relationship = db.relationship("EntityRelationship")
    rssi = db.Column(db.Float)

    #db.Index("obs_unique_idx", classroom_id, observed_at, relationship_id, unique=True)

    def __init__(self, classroom_id, observed_at, relationship, rssi):
        self.classroom_id = classroom_id
        self.observed_at = dateutil.parser.parse(observed_at)
        if self.observed_at.tzinfo != None:
            self.observed_at = self.observed_at.astimezone(pytz.utc)
        self.relationship = relationship
        self.rssi = rssi

    def as_dict_for_bulk_insert(self):
       return dict(
         classroom_id=self.classroom_id,
         observed_at=self.observed_at.isoformat(),
         relationship_id=self.relationship.id,
         rssi=self.rssi)

    def as_dict_for_web_resource(self):
       return dict(
         classroom_id=self.classroom_id,
         observed_at=self.observed_at.isoformat(),
         local_id=self.relationship.entity1_id,
         local_type=self.relationship.entity1_type.name,
         remote_id=self.relationship.entity2_id,
         remote_type=self.relationship.entity2_type.name,
         rssi=self.rssi)

    @staticmethod
    def bulk_store(obs):
        insert_stmt = insert(RadioObservation.__table__)

        do_nothing_stmt = insert_stmt.on_conflict_do_nothing(
            index_elements=['classroom_id', 'observed_at', 'relationship_id']
        )
        obs_values = [o.as_dict_for_bulk_insert() for o in obs]

        db.session.execute(do_nothing_stmt, obs_values)
        db.session.commit()
