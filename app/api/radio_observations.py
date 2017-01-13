from flask import request
from shared import *
from ..models import *

# Radio Observations upload #
@api.route('/api/v1/radio_observations', methods=['POST'])
@api_auth.requires_auth
def post_radio_observations():
    event_data = request.get_json()
    if not event_data:
        abort(400)
    if not isinstance(event_data, list):
        event_data = [event_data]

    classroom_id = event_data[0]['classroom_id']

    mappings = {m.sensor_id: m for m in SensorMapping.query.filter_by(classroom_id=classroom_id, end_time=None)}
    relationships = {r.key(): r for r in EntityRelationship.query.filter_by(classroom_id=classroom_id)}

    for event in event_data:
        local_mapping = mappings.get(event['local_id'])
        remote_mapping = mappings.get(event['remote_id'])

        if local_mapping and remote_mapping:
            key = EntityRelationship.generate_key(
               local_mapping.entity_type.value, local_mapping.entity_id,
               remote_mapping.entity_type.value, remote_mapping.entity_id
            )
            relationship = relationships.get(key)
            if not relationship:
                relationship = EntityRelationship(classroom_id,
                   local_mapping.entity_type, local_mapping.entity_id,
                   remote_mapping.entity_type, remote_mapping.entity_id
                )
                relationships[relationship.key()] = relationship
                if relationship.should_be_stored():
                    db.session.add(relationship)

            if relationship.should_be_stored():
                db.session.add(RadioObservation(
                    event.get('classroom_id'),
                    event.get('local_id'),
                    event.get('remote_id'),
                    event.get('observed_at'),
                    relationship,
                    event.get('rssi')))
    db.session.commit()
    return "OK", 201

@api.route('/api/v1/radio_observations', methods=['GET'])
@api_auth.requires_auth
def radio_observations_index():
    classroom_id = request.args.get('classroom_id')
    if not classroom_id:
        abort(400, "Missing classroom_id parameter")

    child_id = request.args.get('child_id')
    if not child_id:
        abort(400, "Missing child_id parameter")

    start_time = request.args.get('start_time')
    if not start_time:
        abort(400, "Missing start_time parameter")

    end_time = request.args.get('end_time')
    if not end_time:
        abort(400, "Missing start_time parameter")

    relationships = EntityRelationship.query.filter(
        EntityRelationship.classroom_id==classroom_id,
        or_(
            and_(
                entity1_type=MappingType.child,
                entity1_id=child_id
            ),
            and_(
                entity2_type=MappingType.child,
                entity2_id=child_id
            )
        )
    ).all()

    relationship_ids = [r.id for r in relationships]

    obs = RadioObservation.query.filter(
        RadioObservation.classroom_id==classroom_id,
        RadioObservation.observed_at >= start_time,
        RadioObservation.observed_at <= end_time,
        RadioObservation.relationship_id.in_(relationship_ids)
    ).all()

    return jsonify([ob.as_dict() for ob in obs])
