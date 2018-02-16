from flask import request, abort, jsonify, current_app
import json, gzip
from sqlalchemy import or_, and_
import numpy as np
from shared import *
from ..models import *
import StringIO
import urllib, urllib2, base64
from dateutil.parser import parse

# Accelerometer Observations upload #
@api.route('/api/v1/location_observations', methods=['POST'])
@api_auth.requires_auth
def post_location_observations():
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

    obs = []

    batch = firebase.db.batch()

    for event in event_data:

        mapping = mappings.get(event['sensor_id'])
        print "sensor_id: %s" % event['sensor_id']
        print "mapping: %s" % mapping
        print "mappings: %s" % mappings
        if mapping:
            ob = LocationObservation(
                    event.get('classroom_id'),
                    event.get('observed_at'),
                    mapping.entity_id,
                    mapping.entity_type,
                    event.get('x_coord'),
                    event.get('y_coord'),
                    event.get('strength'))
            obs.append(ob)
            observed_at = event.get('observed_at')
            path = 'classrooms/%s/location_observations/%s-%s-%s' % (classroom_id, mapping.entity_type.value, mapping.entity_id, observed_at)
            doc_ref = firebase.db.document(path)
            json_data = ob.as_dict_for_web_resource()
            print "json_data: %s" % json_data

            batch.set(doc_ref, {
                'entityType': u'%s' % json_data['entity_type'],
                'entityId': json_data['entity_id'],
                'strength': json_data['strength'],
                'x': json_data['x_coord'],
                'y': json_data['y_coord'],
                'observedAt': parse(observed_at)
            })

    if len(obs) > 0:
        batch.commit()
        LocationObservation.bulk_store(obs)
    return "OK", 201



@api.route('/api/v1/location_observations', methods=['GET'])
@api_auth.requires_auth
def location_observations_index():
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

    mappings_to_end = SensorMapping.query.filter_by(classroom_id=classroom_id,sensor_id=sensor_id,end_time=None).all()


    entities.discard((entity_type, entity_id))
    entities = list(entities)
    entities.sort()
    entities_idx = dict((e,i) for (i,e) in enumerate(entities))

    obs = LocationObservation.query.filter(
        LocationObservation.classroom_id==classroom_id,
        LocationObservation.observed_at >= start_time,
        LocationObservation.observed_at <= end_time,
        LocationObservation.entity_id==entity_id,
        LocationObservation.entity_type==entity_type
    ).all()

    timestamps = set()
    for ob in obs:
        timestamps.add(ob.observed_at)
    timestamps = list(timestamps)
    timestamps.sort()

    timestamps_idx = dict((t,i) for (i,t) in enumerate(timestamps))

    output = np.zeros([len(entities), len(timestamps), 3])

    for ob in obs:
        (entity_idx, direction) = relationships_idx[ob.relationship_id]
        output[entity_idx, timestamps_idx[ob.observed_at], 0] = ob.x_coord
        output[entity_idx, timestamps_idx[ob.observed_at], 1] = ob.y_coord

    return jsonify({
        'obs': output.tolist(),
        'entities': entities,
        'timestamps': timestamps
    })
