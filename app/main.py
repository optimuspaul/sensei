from flask import Flask
from tc_auth_service import TCAuthService
from models import db,migrate
from api import api
from api.api_json import APIJSONEncoder
from flask_cors import CORS

def create_app(config_obj):
    app = Flask('sensei')
    CORS(app, resources=r'/api/*')
    app.config.from_object(config_obj)
    app.json_encoder = APIJSONEncoder
    db.init_app(app)
    migrate.init_app(app,db)
    app.register_blueprint(api)
    with app.app_context():
        db.create_all()

    return app
