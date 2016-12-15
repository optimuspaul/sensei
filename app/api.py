from app import app
import re
from flask import request, g
from api_auth_wrapper import APIAuthWrapper
from models import *

# Configure API Authorization
api_auth = APIAuthWrapper()

# Sensor Proximity Events upload API #
@app.route('/api/v1/sensor_proximity_events', methods=['POST'])
@api_auth.requires_auth
def post_sensor_proximity_events():
    # TODO: auth
    event_data = request.get_json()
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
#@app.route('/api/v1/sensor_mappings', methods=['POST'])
