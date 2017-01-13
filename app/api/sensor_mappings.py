from flask import request, jsonify
import datetime
from shared import *
from ..models import *

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
        entity_type = mapping.get('entity_type')
        entity_id = mapping.get('entity_id')
        now = datetime.datetime.now()
        mappings_to_end = SensorMapping.query.filter_by(sensor_id=sensor_id,end_time=None).all()
        mappings_to_end.extend(SensorMapping.query.filter_by(entity_id=entity_id,entity_type=entity_type,end_time=None))
        for m in mappings_to_end:
            m.end_time = now

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
