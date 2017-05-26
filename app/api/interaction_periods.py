from flask import request, abort, jsonify
import json, gzip
from sqlalchemy import or_, and_
import numpy as np
from shared import *
from ..models import *
import StringIO

# Interaction Periods upload #
@api.route('/api/v1/interaction_periods', methods=['POST'])
@api_auth.requires_auth
def post_interaction_periods():
    if request.headers.get('Content-Encoding') == 'gzip':
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
        if event['local_id'] == event['remote_id']:
            # this is garbage
            continue

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
                obs.append(InteractionPeriod(
                    event.get('classroom_id'),
                    event.get('started_at'),
                    event.get('ended_at'),
                    relationship))
    db.session.commit() # This stores the new relationships
    if len(obs) > 0:
        InteractionPeriod.bulk_store(obs)
    return "OK", 201


@api.route('/api/v1/interaction_periods', methods=['GET'])
@api_auth.requires_auth
def interaction_periods_index():
    classroom_id = request.args.get('classroom_id')
    if not classroom_id:
        abort(400, "Missing classroom_id parameter")

    entity_id = request.args.get('entity_id')
    if not entity_id:
        abort(400, "Missing entity_id parameter")
    entity_id = int(entity_id)
    entity_type = request.args.get('entity_type')
    if not entity_id:
        abort(400, "Missing entity_type parameter")    
    

    start_time = assert_iso8601_time_param('start_time')
    end_time = assert_iso8601_time_param('end_time')

    relationships = EntityRelationship.query.filter(
        EntityRelationship.classroom_id==classroom_id,
        EntityRelationship.entity1_type==entity_type,
        EntityRelationship.entity1_id==entity_id
    ).order_by(EntityRelationship.entity2_type.asc(),
               EntityRelationship.entity2_id.asc()).all()

    output = []
    entities = []
    earliest_timestamp = None
    latest_timestamp = None
    for rel in relationships:
        ips = []
        obs = RadioObservation.query.filter(
                RadioObservation.classroom_id==classroom_id,
                RadioObservation.relationship==rel,
                RadioObservation.observed_at >= start_time,
                RadioObservation.observed_at <= end_time,
              ).order_by(RadioObservation.observed_at.asc()).all()

        cutoff_idx = 0
        if len(obs) > 0:
            prev_marker = obs[0].observed_at
            avg = 0
            ips = []
            for idx, ob in enumerate(obs[1:]):
                time_diff = (ob.observed_at-prev_marker).seconds
                idx_diff = idx - cutoff_idx
                prev_avg = avg
                avg = idx_diff / (time_diff/10.0)
                if avg < 0.70:
                    if idx_diff > 0 and prev_avg >= 0.7:
                        actual_time_diff = (obs[idx].observed_at - prev_marker).seconds
                        if actual_time_diff > 300:
                            ips.append([prev_marker, obs[idx].observed_at])
                            if latest_timestamp is None or latest_timestamp < obs[idx].observed_at:
                                latest_timestamp = obs[idx].observed_at
                            if earliest_timestamp is None or earliest_timestamp > prev_marker:
                                earliest_timestamp = prev_marker
                    cutoff_idx = idx
                    prev_marker = ob.observed_at
        entities.append([rel.entity2_type.value,rel.entity2_id])
        output.append(ips)

    return jsonify({
        'obs': output,
        'entities': entities,
        'timestamps': [
            earliest_timestamp,
            latest_timestamp
        ]
    })
