from flask import request, jsonify, abort
from shared import *
from ..models import *

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
    area = Area(
      request.json.get('classroom_id'),
      request.json.get('name'),
      request.json.get('x_position'),
      request.json.get('y_position'),
      request.json.get('z_position'))
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
    area.x_position = request.json.get('x_position', area.x_position)
    area.y_position = request.json.get('y_position', area.y_position)
    area.z_position = request.json.get('z_position', area.z_position)
    db.session.commit()
    return jsonify( area.as_dict() )
