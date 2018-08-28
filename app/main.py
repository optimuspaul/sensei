from flask import Flask
from tc_auth_service import TCAuthService
from models import db, migrate
from api import api
from api.api_json import APIJSONEncoder
from flask_cors import CORS
from data_publisher import data_publisher
from location_model_feeder import LocationModelFeeder
from flask_redis import FlaskRedis
from test_mocks import MockRedis


def create_app(config_obj):
    app = Flask(__name__)
    CORS(app, resources=r'/api/*')
    app.config.from_object(config_obj)
    app.json_encoder = APIJSONEncoder
    db.init_app(app)
    migrate.init_app(app, db)
    app.register_blueprint(api)

    @app.route('/camera-segment-builder')
    def camera_segment_builder():
        return app.send_static_file('index.html')

    @app.route('/static/js/<filename>')
    def main_js(filename):
        return app.send_static_file('bundle.js')

    @app.route('/static/css/<filename>')
    def main_css(filename):
        return app.send_static_file('bundle.css')

    @app.route('/assets/<filename>')
    def main_assets(filename):
        print("filename: %s" % filename)
        return app.send_static_file(filename)

    with app.app_context():
        db.create_all()

    if app.config.get("REDIS_URL"):
        redis_store = FlaskRedis()
    else:
        redis_store = MockRedis()
    redis_store.init_app(app)

    location_model_feeder = LocationModelFeeder()
    data_publisher.register_listener(location_model_feeder)

    return app
