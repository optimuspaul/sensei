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

    output = []
    entities = []
    earliest_timestamp = None
    latest_timestamp = None

    relationships = EntityRelationship.query.filter(
            EntityRelationship.classroom_id==classroom_id,
            EntityRelationship.entity1_type==entity_type,
            EntityRelationship.entity1_id==entity_id
        ).order_by(EntityRelationship.entity2_type.asc(),
                   EntityRelationship.entity2_id.asc()).all()

    for rel in relationships:

        ips = []

        interaction_periods = InteractionPeriod.query.filter(
                InteractionPeriod.classroom_id==classroom_id,
                InteractionPeriod.relationship_id==rel.id,
                InteractionPeriod.started_at >= start_time,
                InteractionPeriod.ended_at <= end_time
            ).order_by(InteractionPeriod.started_at.asc()).all()

        for ip in interaction_periods:
            ips.append([ip.started_at, ip.ended_at])
            if latest_timestamp is None or latest_timestamp < ip.ended_at:
               latest_timestamp = ip.ended_at
            if earliest_timestamp is None or earliest_timestamp > ip.started_at:
               earliest_timestamp = ip.started_at

        if len(ips) > 0:
            output.append(ips)
            entities.append([rel.entity2_type.value,rel.entity2_id])

    return jsonify({
        'obs': output,
        'entities': entities,
        'timestamps': [
            latest_timestamp,
            earliest_timestamp
        ]
    })
