from flask import Blueprint
from flask_cors import CORS
from api_auth_wrapper import APIAuthWrapper


api = Blueprint('api', __name__)
CORS(api)

# Get decorator for basic auth
api_auth = APIAuthWrapper()
