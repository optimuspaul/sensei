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

# Sensor Proximity Events upload #
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

# Sensor Mapping - index #
@api.route('/api/v1/sensor_mappings', methods = ['GET'])
@api_auth.requires_auth
def sensor_mappings_index():
    classroom_id = request.args.get('classroom_id')
    if not classroom_id:
        abort(400, "Missing classroom_id parameter")
    mappings = SensorMapping.query.filter_by(classroom_id=classroom_id, end_time=None).all()
    return jsonify([m.as_dict() for m in mappings])

# Sensor Mapping - create/update #
@api.route('/api/v1/sensor_mappings', methods=['POST'])
@api_auth.requires_auth
def create_sensor_mapping():
    map_data = request.get_json()
    if not map_data:
        abort(400, "Expected array of SensorMapping objects in body")

    for mapping in map_data:
        sensor_id = mapping.get('sensor_id')
        now = datetime.datetime.now()
        existing = SensorMapping.query.filter_by(sensor_id=sensor_id,end_time=None).first()
        if existing:
            existing.end_time = now

        if mapping.get('entity_type') and mapping.get('entity_id'):
            new_mapping = SensorMapping(
                mapping.get('classroom_id'),
                sensor_id,
                now,
                None,
                mapping.get('entity_type'),
                mapping.get('entity_id'),
                )
            db.session.add(new_mapping)

    db.session.commit()
    return "OK", 201

# Areas - index #
@api.route('/api/v1/areas', methods = ['GET'])
@api_auth.requires_auth
def areas_index():
    classroom_id = request.args.get('classroom_id')
    if not classroom_id:
        abort(400, "Missing classroom_id parameter")
    areas = Area.query.filter_by(classroom_id=classroom_id).all()
    return jsonify([a.as_dict() for a in areas])

# Areas - create #
@api.route('/api/v1/areas', methods = ['POST'])
@api_auth.requires_auth
def create_area():
    if not request.json or not 'name' in request.json or not 'classroom_id' in request.json:
        abort(400)
    area = Area(request.json.get('classroom_id'), request.json.get('name'))
    db.session.add(area)
    db.session.commit()
    return jsonify( area.as_dict() ), 201

# Areas - delete #
@api.route('/api/v1/areas/<int:id>', methods = ['DELETE'])
@api_auth.requires_auth
def delete_area(id):
    db.session.delete(Area.query.get(id))
    db.session.commit()
    return jsonify( { 'result': True } )

# Areas - update #
@api.route('/api/v1/areas/<int:id>', methods = ['PUT'])
@api_auth.requires_auth
def update_area(id):
    area = Area.query.get(id)
    area.name = request.json.get('name', area.name)
    db.session.commit()
    return jsonify( area.as_dict() )

# Classrooms - index #
@api.route('/api/v1/classrooms', methods = ['GET'])
@api_auth.requires_auth
def classrooms_index():
    classrooms = Classroom.get_for_user(current_app.config.get("TC_SERVICE"), g.user)
    return jsonify([c.as_dict() for c in classrooms])
