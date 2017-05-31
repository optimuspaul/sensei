import dateutil.parser
from shared import *
from sqlalchemy.dialects.postgresql import insert
import pytz

# Interaction Period between various entities
class InteractionPeriod(db.Model):
    classroom_id = db.Column(db.Integer, nullable=False, primary_key=True)
    started_at = db.Column(db.DateTime, nullable=False, primary_key=True)
    ended_at = db.Column(db.DateTime, nullable=False, primary_key=True)
    relationship_id = db.Column(db.Integer,  db.ForeignKey('entity_relationship.id'), nullable=False, primary_key=True)
    relationship = db.relationship("EntityRelationship")


    def __init__(self, classroom_id, started_at, ended_at, relationship):
        self.classroom_id = classroom_id
        self.started_at = dateutil.parser.parse(started_at)
        if self.started_at.tzinfo != None:
            self.started_at = self.started_at.astimezone(pytz.utc)
        self.ended_at = dateutil.parser.parse(ended_at)
        if self.ended_at.tzinfo != None:
            self.ended_at = self.ended_at.astimezone(pytz.utc)
        self.relationship = relationship

    def as_dict_for_bulk_insert(self):
       return dict(
         classroom_id=self.classroom_id,
         started_at=self.started_at.isoformat(),
         ended_at=self.ended_at.isoformat(),
         relationship_id=self.relationship.id)

    @staticmethod
    def bulk_store(obs):
        insert_stmt = insert(InteractionPeriod.__table__)

        do_nothing_stmt = insert_stmt.on_conflict_do_nothing(
            index_elements=['classroom_id', 'started_at', 'ended_at', 'relationship_id']
        )
        obs_values = [o.as_dict_for_bulk_insert() for o in obs]
        print "obs_values %s" % obs_values
        db.session.execute(do_nothing_stmt, obs_values)
        db.session.commit()
