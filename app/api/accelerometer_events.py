from flask import request, abort, jsonify
import json, gzip
from sqlalchemy import or_, and_
import numpy as np
from shared import *
from ..models import *
import StringIO

# Accelerometer Events upload #
@api.route('/api/v1/accelerometer_events', methods=['POST'])
@api_auth.requires_auth
def post_accelerometer_events():
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
            obs.append(AccelerometerEvent(
                        event.get('classroom_id'),
                        event.get('observed_at'),
                        mapping.entity_id,
                        mapping.entity_type,
                        event.get('event_type')))
    if len(obs) > 0:
        AccelerometerEvent.bulk_store(obs)
    return "OK", 201



@api.route('/api/v1/accelerometer_events', methods=['GET'])
@api_auth.requires_auth
def accelerometer_events_index():
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

    print "start_time: %s" % start_time
    print "end_time: %s" % end_time
    print "classroom_id: %s" % classroom_id
    print "entity_id: %s" % entity_id
    print "entity_type: %s" % entity_type

    events = AccelerometerEvent.query.filter(
        AccelerometerEvent.classroom_id==classroom_id,
        AccelerometerEvent.observed_at >= start_time,
        AccelerometerEvent.observed_at <= end_time,
        AccelerometerEvent.entity_id==entity_id,
        AccelerometerEvent.entity_type==entity_type
    ).order_by(AccelerometerEvent.observed_at.asc()).all()

    output = []

    for ev in events:
        output.append([ev.observed_at, ev.event_type])

    print "events: %s" % jsonify(output)

    return jsonify(output)
