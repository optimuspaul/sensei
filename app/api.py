from app import app
import re
from api_auth_wrapper import APIAuthWrapper
from tc_auth_service import TCAuthService
from models import *

# TODO: select config based on environment
app.config.from_object('config.BaseConfig')
app.config['DEBUG'] = True

# Configure API Authorization
auth_svc = TCAuthService('http://localhost:3000/api/v1/authenticate.json')
api_auth = APIAuthWrapper(auth_svc)

# API #
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
