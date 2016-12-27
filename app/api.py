import re
from flask import request, g, current_app, Blueprint
from api_auth_wrapper import APIAuthWrapper
from models import *

api = Blueprint('api', __name__)

# Get decorator for basic auth
api_auth = APIAuthWrapper()

# Sensor Proximity Events upload API #
@api.route('/api/v1/sensor_proximity_events', methods=['POST'])
@api_auth.requires_auth
def post_sensor_proximity_events():
    event_data = request.get_json()
    if not event_data:
        abort(400)
    if not isinstance(event_data, list):
        event_data = [event_data]
    for event in event_data:
        db.session.add(SensorProximityEvent(
            event.get('school_id'),
            event.get('local_id'),
            event.get('remote_id'),
            event.get('observed_at'),
            event.get('rssi')))
    db.session.commit()
    return "%d" % len(event_data)

# Sensor Mapping API #
@api.route('/api/v1/sensor_mappings', methods=['POST'])
@api_auth.requires_auth
def create_sensor_mapping():
    map_data = request.get_json()
    if not map_data:
        abort(400)
    dev = SensorMapping(map_data.classroom_id, )
    db.session.add(dev)
    db.session.commit()
    return jsonify( { 'developer': dev } ), 201
