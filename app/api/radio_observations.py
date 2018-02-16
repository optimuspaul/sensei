from flask import request, abort, jsonify, current_app
import json, gzip
from sqlalchemy import or_, and_
import numpy as np
from shared import *
from ..models import *
import StringIO
import urllib, urllib2, base64


# Radio Observations upload #
@api.route('/api/v1/radio_observations', methods=['POST'])
@api_auth.requires_auth
def post_radio_observations():
    firebase = current_app.config.get("FIREBASE_SERVICE")
    if request.headers.get('Content-Encoding') == 'gzip':
        file = StringIO.StringIO(request.data)
        f = gzip.GzipFile(fileobj=file, mode="rb")
        event_data = json.loads(f.read())
    else:
        event_data = request.get_json()
    if not event_data:
        abort(400, "Missing event data")
    if not isinstance(event_data, list):
        event_data = [event_data]

    classroom_id = event_data[0]['classroom_id']

    mappings = {m.sensor_id: m for m in SensorMapping.query.filter_by(classroom_id=classroom_id, end_time=None)}
    relationships = {r.key(): r for r in EntityRelationship.query.filter_by(classroom_id=classroom_id)}

    obs = []

    batch = firebase.db.batch()

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
                ob = RadioObservation(
                    event.get('classroom_id'),
                    event.get('observed_at'),
                    relationship,
                    event.get('rssi'))
                obs.append(ob)
                observed_at = event.get('observed_at')
                path = 'classrooms/%s/radio_observations/%s-%s-%s' % (classroom_id, local_mapping.entity_type.value, local_mapping.entity_id, observed_at)
                doc_ref = firebase.db.document(path)
                json_data = ob.as_dict_for_web_resource()
                print "json_data: %s" % json_data

                batch.set(doc_ref, {
                    'localType': u'%s' % json_data['local_type'],
                    'localId': json_data['local_id'],
                    'rssi': json_data['rssi'],
                    'remoteType': u'%s' % json_data['remote_type'],
                    'remoteId': json_data['remote_id'],
                    'observedAt': u'%s' % json_data['observed_at'],
                })

    db.session.commit() # This stores the new relationships
    if len(obs) > 0:

        batch.commit()

        RadioObservation.bulk_store(obs)

        

    return "OK", 201



@api.route('/api/v1/radio_observations', methods=['GET'])
@api_auth.requires_auth
def radio_observations_index():
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

    as_matrix = request.args.get('as_matrix', default='True') != 'False'

    print("Got as_matrix flag: %s" % as_matrix)

    start_time = assert_iso8601_time_param('start_time')
    end_time = assert_iso8601_time_param('end_time')

    relationships = EntityRelationship.query.filter(
        EntityRelationship.classroom_id==classroom_id,
        or_(
            and_(
                EntityRelationship.entity1_type==entity_type,
                EntityRelationship.entity1_id==entity_id
            ),
            and_(
                EntityRelationship.entity2_type==entity_type,
                EntityRelationship.entity2_id==entity_id
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

    if not as_matrix:
        return jsonify([o.as_dict_for_web_resource() for o in obs])
    else:
        entities = set(
            [(rel.entity1_type.value, rel.entity1_id) for rel in relationships] +
            [(rel.entity2_type.value, rel.entity2_id) for rel in relationships]
        )
        entities.discard((entity_type, entity_id))
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
