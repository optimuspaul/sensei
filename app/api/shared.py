from flask import Blueprint, request, abort
from flask_cors import CORS
from api_auth_wrapper import APIAuthWrapper
import dateutil.parser
import pytz

api = Blueprint('api', __name__)
CORS(api)

# Get decorator for basic auth
api_auth = APIAuthWrapper()

def get_iso8601_time_param(name):
    datestring = request.args.get(name)
    if not datestring:
        return None
    timestamp = dateutil.parser.parse(datestring)
    if timestamp.tzinfo != None:
        timestamp = timestamp.astimezone(pytz.utc).replace(tzinfo=None)
    return timestamp

def assert_iso8601_time_param(name):
    timestamp = get_iso8601_time_param(name)
    if not timestamp:
        abort(400, "Missing %s parameter" % name)
    return timestamp
