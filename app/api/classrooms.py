from flask import current_app, jsonify, g
from shared import *
from ..models import *

# Classrooms - index #
@api.route('/api/v1/classrooms', methods = ['GET'])
@api_auth.requires_auth
def classrooms_index():
    tc = current_app.config.get("TC_SERVICE")
    classrooms = Classroom.get_for_user(tc, g.user)
    output = []
    for c in classrooms:
        # Fetch mappings for this classroom.
        mappings = SensorMapping.query.filter_by(classroom_id=c.id, end_time=None).all()
        # Fetch teachers, children, areas, and materials for this classroom
        teacher_map = {t.id: t for t in Teacher.get_for_classroom(tc, g.user, c.id)}
        child_map = {c.id: c for c in  Child.get_for_classroom(tc, g.user, c.id)}
        area_map = {a.id: a for a in Area.query.filter_by(classroom_id=c.id).all()}
        material_map = {m.id: m for m in Material.query.filter_by(classroom_id=c.id).all()}
        sensor_mappings = []
        for m in mappings:
            entity = None
            if m.entity_type.value == 'child':
                entity = child_map.get(int(m.entity_id))
            elif m.entity_type.value == 'teacher':
                entity = teacher_map.get(int(m.entity_id))
            elif m.entity_type.value == 'area':
                entity = area_map.get(int(m.entity_id))
            elif m.entity_type.value == 'material':
                entity = material_map.get(int(m.entity_id))

            if entity:
                name = entity.name
            else:
                name = "unknown"
                entity = {'name': "unknown", 'type':m.entity_type.value}
            sensor_mappings.append({
                'sensor_id': m.sensor_id,
                'name': entity.name,
                'entity_type': m.entity_type.value})
        classroom_json = c.as_dict()
        classroom_json['sensor_mappings'] = sensor_mappings
        output.append(classroom_json)
    return jsonify(output)
