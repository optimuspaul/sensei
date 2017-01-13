from shared import *
from sensor_mapping import MappingType

# Entity Relationship relationships between children, teachers, materials,
# and areas. A single relationship may have two rows, representing each
# direction.
class EntityRelationship(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    classroom_id = db.Column(db.Integer, nullable=False)
    entity1_type = db.Column(db.Enum(MappingType), nullable=False)
    entity1_id = db.Column(db.Integer, nullable=False)
    entity2_type = db.Column(db.Enum(MappingType), nullable=False)
    entity2_id = db.Column(db.Integer, nullable=False)

    STORED_ENTITY_TYPE_PAIRS = frozenset([
        frozenset([MappingType.child, MappingType.child]),
        frozenset([MappingType.child, MappingType.teacher]),
        frozenset([MappingType.child, MappingType.material]),
        frozenset([MappingType.child, MappingType.area]),
        frozenset([MappingType.teacher, MappingType.area]),
        frozenset([MappingType.teacher, MappingType.material]),
    ])

    def __init__(self, classroom_id, entity1_type, entity1_id, entity2_type, entity2_id):
        self.classroom_id = classroom_id
        self.entity1_type = entity1_type
        self.entity1_id = entity1_id
        self.entity2_type = entity2_type
        self.entity2_id = entity2_id

    @staticmethod
    def generate_key(entity1_type, entity1_id, entity2_type, entity2_id):
        return "%s:%d:%s:%d" % (entity1_type, entity1_id, entity2_type, entity2_id)

    def key(self):
        return EntityRelationship.generate_key(
          self.entity1_type.value, self.entity1_id,
          self.entity2_type.value, self.entity2_id
        )

    def entity_type_pair(self):
        return set([self.entity1_type, self.entity2_type])

    def should_be_stored(self):
        return self.entity_type_pair() in EntityRelationship.STORED_ENTITY_TYPE_PAIRS
