from flask import request, abort, jsonify
import json, gzip
from sqlalchemy import or_, and_
import numpy as np
from shared import *
from ..models import *
import StringIO

# Accelerometer Observations upload #
@api.route('/api/v1/accelerometer_observations', methods=['POST'])
@api_auth.requires_auth
def post_accelerometer_observations():
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

    for event in event_data:

        mapping = mappings.get(event['sensor_id'])
        print "sensor_id: %s" % event['sensor_id']
        print "mapping: %s" % mapping
        print "mappings: %s" % mappings
        if mapping:
            obs.append(AccelerometerObservation(
                        event.get('classroom_id'),
                        event.get('observed_at'),
                        mapping.entity_id,
                        mapping.entity_type,
                        event.get('x_acceleration'),
                        event.get('y_acceleration'),
                        event.get('z_acceleration')))
    if len(obs) > 0:
        AccelerometerObservation.bulk_store(obs)
    return "OK", 201



@api.route('/api/v1/accelerometer_observations', methods=['GET'])
@api_auth.requires_auth
def accelerometer_observations_index():
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

    obs = AccelerometerObservation.query.filter(
        AccelerometerObservation.classroom_id==classroom_id,
        AccelerometerObservation.observed_at >= start_time,
        AccelerometerObservation.observed_at <= end_time,
        AccelerometerObservation.entity_id==entity_id,
        AccelerometerObservation.entity_type==entity_type
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
        output[entity_idx, timestamps_idx[ob.observed_at], 0] = ob.x_acceleration
        output[entity_idx, timestamps_idx[ob.observed_at], 1] = ob.y_acceleration
        output[entity_idx, timestamps_idx[ob.observed_at], 2] = ob.z_acceleration

    return jsonify({
        'obs': output.tolist(),
        'entities': entities,
        'timestamps': timestamps
    })
