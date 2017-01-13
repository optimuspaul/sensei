from flask import request, jsonify
from shared import *
from ..models import *

# Classroom Materials - index *
@api.route('/api/v1/materials', methods = ['GET'])
@api_auth.requires_auth
def materials_index():
    classroom_id = request.args.get('classroom_id')
    if not classroom_id:
        abort(400, "Missing classroom_id parameter")
    materials = Material.query.filter_by(classroom_id=classroom_id).all()
    return jsonify([a.as_dict() for a in materials])

# Classroom Materials - create #
@api.route('/api/v1/materials', methods = ['POST'])
@api_auth.requires_auth
def create_material():
    if not request.json or not 'name' in request.json or not 'classroom_id' in request.json:
        abort(400)
    material = Material(request.json.get('classroom_id'), request.json.get('name'), request.json.get('lesson_id'))
    db.session.add(material)
    db.session.commit()
    return jsonify( material.as_dict() ), 201

# Classroom Materials - delete #
@api.route('/api/v1/materials/<int:id>', methods = ['DELETE'])
@api_auth.requires_auth
def delete_material(id):
    db.session.delete(Material.query.get(id))
    db.session.commit()
    return jsonify( { 'result': True } )

# Classroom Materials - update #
@api.route('/api/v1/materials/<int:id>', methods = ['PUT'])
@api_auth.requires_auth
def update_material(id):
    material = Material.query.get(id)
    material.name = request.json.get('name', material.name)
    db.session.commit()
    return jsonify( material.as_dict() )
