import re
from flask import request, g, current_app, Blueprint, jsonify, abort, send_file
from flask_cors import CORS
from api_auth_wrapper import APIAuthWrapper
from models import *
import datetime

api = Blueprint('api', __name__)
CORS(api)

# Get decorator for basic auth
api_auth = APIAuthWrapper()

@api.route('/api/v1/docs/api.yaml', methods=['GET'])
def docs():
    return send_file('static/docs/api.yaml')

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
    return "OK", 201

# Sensor Mapping API - index #
@api.route('/api/v1/sensor_mappings', methods = ['GET'])
@api_auth.requires_auth
def sensor_mappings_index():
    classroom_id = request.args.get('classroom_id')
    if not classroom_id:
        abort(400, "Missing classroom_id parameter")
    mappings = SensorMapping.query.filter_by(classroom_id=classroom_id, end_time=None).all()
    return jsonify([m.as_dict() for m in mappings])

# Sensor Mapping API - create/update #
@api.route('/api/v1/sensor_mappings', methods=['POST'])
@api_auth.requires_auth
def create_sensor_mapping():
    map_data = request.get_json()
    if not map_data:
        abort(400, "Expected SensorMapping object in body")
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
    return "OK", 201

# Sensor Areas API - index #
@api.route('/api/v1/areas', methods = ['GET'])
@api_auth.requires_auth
def areas_index():
    classroom_id = request.args.get('classroom_id')
    if not classroom_id:
        abort(400, "Missing classroom_id parameter")
    areas = Area.query.filter_by(classroom_id=classroom_id).all()
    return jsonify([a.as_dict() for a in areas])

# Sensor Areas API - create #
@api.route('/api/v1/areas', methods = ['POST'])
@api_auth.requires_auth
def create_area():
    if not request.json or not 'name' in request.json or not 'classroom_id' in request.json:
        abort(400)
    area = Area(request.json.classroom_id, request.json.name)
    db.session.add(area)
    db.session.commit()
    return jsonify( area ), 201

# Sensor Areas API - delete #
@api.route('/api/v1/areas/<int:id>', methods = ['DELETE'])
@api_auth.requires_auth
def delete_area(id):
    db.session.delete(Area.query.get(id))
    db.session.commit()
    return jsonify( { 'result': True } )

# Sensor Areas API - update #
@api.route('/api/v1/areas/<int:id>', methods = ['PUT'])
@api_auth.requires_auth
def update_area(id):
    area = Area.query.get(id)
    area.name = request.json.get('name', dev.name)
    db.session.commit()
    return jsonify( area )
