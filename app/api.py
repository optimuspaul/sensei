import re
from flask import request, g, current_app, Blueprint, jsonify, abort
from api_auth_wrapper import APIAuthWrapper
from models import *
import datetime

api = Blueprint('api', __name__)

# Get decorator for basic auth
api_auth = APIAuthWrapper()

# Sensor Proximity Events upload API #
@api.route('/api/v1/proximity_events', methods=['POST'])
@api_auth.requires_auth
def post_proximity_events():
    event_data = request.get_json()
    if not event_data:
        abort(400)
    if not isinstance(event_data, list):
        event_data = [event_data]
    for event in event_data:
        db.session.add(ProximityEvent(
            event.get('classroom_id'),
            event.get('local_id'),
            event.get('remote_id'),
            event.get('observed_at'),
            event.get('rssi')))
    db.session.commit()
    return "%d" % len(event_data)

# Sensor Mapping API - create/update #
@api.route('/api/v1/sensor_mappings', methods=['POST'])
@api_auth.requires_auth
def create_sensor_mapping():
    map_data = request.get_json()
    if not map_data:
        abort(400)
    sensor_id = map_data.get('sensor_id')
    now = datetime.datetime.now()
    existing = SensorMapping.query.filter_by(sensor_id=sensor_id,end_time=None).first()
    if existing:
        existing.end_time = now

    new_mapping = SensorMapping(
        map_data.get('classroom_id'),
        sensor_id,
        now,
        None,
        map_data.get('mapping_type'),
        map_data.get('target_id'),
        )
    db.session.add(new_mapping)
    db.session.commit()
    return "OK", 200

# Sensor Mapping API - index #
@api.route('/api/v1/sensor_mappings', methods = ['GET'])
def index():
    classroom_id = request.args.get('classroom_id')
    if not classroom_id:
        abort(400)
    mappings = SensorMapping.query.filter_by(classroom_id=classroom_id, end_time=None).all()
    return jsonify([m.as_dict() for m in mappings])
