from flask import request, jsonify, abort, g, current_app
from shared import *
from ..models import *

# Areas - index #
@api.route('/api/v1/fb_token', methods = ['GET'])
@api_auth.requires_auth
def fb_token_index():
    firebase = current_app.config.get("FIREBASE_SERVICE")
    token = firebase.auth.create_custom_token(g.user.email)
    return token