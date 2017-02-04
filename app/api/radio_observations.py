from flask import request, abort, jsonify
import json, gzip
from sqlalchemy import or_, and_
import numpy as np
from shared import *
from ..models import *
import dateutil.parser
import StringIO

# Radio Observations upload #
@api.route('/api/v1/radio_observations', methods=['POST'])
@api_auth.requires_auth
def post_radio_observations():
    if 'gzip' in request.headers['Content-Encoding']:
        file = StringIO.StringIO(request.data)
        f = gzip.GzipFile(fileobj=file, mode="rb")
        event_data = json.loads(f.read())
    else:
        event_data = request.get_json()
    if not event_data:
        abort(400)
    if not isinstance(event_data, list):
        event_data = [event_data]

    classroom_id = event_data[0]['classroom_id']

    mappings = {m.sensor_id: m for m in SensorMapping.query.filter_by(classroom_id=classroom_id, end_time=None)}
    relationships = {r.key(): r for r in EntityRelationship.query.filter_by(classroom_id=classroom_id)}

    obs = []

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
                obs.append(RadioObservation(
                    event.get('classroom_id'),
                    event.get('observed_at'),
                    relationship,
                    event.get('rssi')))
    db.session.commit() # This stores the new relationships
    if len(obs) > 0:
        RadioObservation.bulk_store(obs)
    return "OK", 201

def assert_iso8601_time_param(name):
    datestring = request.args.get(name)
    if not datestring:
        abort(400, "Missing %s parameter" % name)
    return dateutil.parser.parse(datestring)

@api.route('/api/v1/radio_observations', methods=['GET'])
@api_auth.requires_auth
def radio_observations_index():
    classroom_id = request.args.get('classroom_id')
    if not classroom_id:
        abort(400, "Missing classroom_id parameter")

    child_id = request.args.get('child_id')
    if not child_id:
        abort(400, "Missing child_id parameter")
    entity_id = int(child_id)
    entity_type = 'child'

    start_time = assert_iso8601_time_param('start_time')
    end_time = assert_iso8601_time_param('end_time')

    relationships = EntityRelationship.query.filter(
        EntityRelationship.classroom_id==classroom_id,
        or_(
            and_(
                EntityRelationship.entity1_type==MappingType.child,
                EntityRelationship.entity1_id==child_id
            ),
            and_(
                EntityRelationship.entity2_type==MappingType.child,
                EntityRelationship.entity2_id==child_id
            )
        )
    ).all()

    entities = set(
        [(rel.entity1_type.value, rel.entity1_id) for rel in relationships] +
        [(rel.entity2_type.value, rel.entity2_id) for rel in relationships]
    )
    entities.remove((entity_type, entity_id))
    entities = list(entities)
    entities.sort()
    entities_idx = dict((e,i) for (i,e) in enumerate(entities))

    # Map EntityRelationship ids to entity,direction
    relationships_idx = {}
    query_entity = (entity_type, entity_id)
    for r in relationships:
        left_entity = (r.entity1_type.value, r.entity1_id)
        right_entity = (r.entity2_type.value, r.entity2_id)
        if left_entity == query_entity:
            relationships_idx[r.id] = (entities_idx[right_entity], 0)
        else:
            relationships_idx[r.id] = (entities_idx[left_entity], 1)

    relationship_ids = [r.id for r in relationships]

    obs = RadioObservation.query.filter(
        RadioObservation.classroom_id==classroom_id,
        RadioObservation.observed_at >= start_time,
        RadioObservation.observed_at <= end_time,
        RadioObservation.relationship_id.in_(relationship_ids)
    ).all()

    timestamps = set()
    for ob in obs:
        timestamps.add(ob.observed_at)
    timestamps = list(timestamps)
    timestamps.sort()

    timestamps_idx = dict((t,i) for (i,t) in enumerate(timestamps))

    output = np.zeros([len(entities), len(timestamps), 2])

    for ob in obs:
        (entity_idx, direction) = relationships_idx[ob.relationship_id]
        output[entity_idx, timestamps_idx[ob.observed_at], direction] = ob.rssi

    return jsonify({
        'obs': output.tolist(),
        'entities': entities,
        'timestamps': timestamps
    })
