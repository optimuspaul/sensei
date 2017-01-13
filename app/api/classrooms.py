from flask import current_app, jsonify, g
from shared import *
from ..models.classroom import Classroom

# Classrooms - index #
@api.route('/api/v1/classrooms', methods = ['GET'])
@api_auth.requires_auth
def classrooms_index():
    classrooms = Classroom.get_for_user(current_app.config.get("TC_SERVICE"), g.user)
    return jsonify([c.as_dict() for c in classrooms])
