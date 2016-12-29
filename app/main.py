from flask import Flask
from tc_auth_service import TCAuthService
from models import db
from api import api
from api_json import APIJSONEncoder


def create_app(config_obj):
    app = Flask(__name__)
    app.config.from_object(config_obj)
    app.config["API_AUTH_SERVICE"] = TCAuthService(app.config["TC_URL"])
    app.json_encoder = APIJSONEncoder
    db.init_app(app)
    app.register_blueprint(api)
    with app.app_context():
        db.create_all()

    return app
