from flask import Flask
from tc_auth_service import TCAuthService
from models import db,migrate
from api import api
from api.api_json import APIJSONEncoder
from flask_cors import CORS

def create_app(config_obj):
    app = Flask(__name__)
    CORS(app, resources=r'/api/*')
    app.config.from_object(config_obj)
    app.json_encoder = APIJSONEncoder
    db.init_app(app)
    migrate.init_app(app,db)
    app.register_blueprint(api)
    @app.route('/camera-segment-builder')
    def camera_segment_builder():
        return app.send_static_file('index.html')
    @app.route('/static/js/<filename>')
    def main_js(filename):
        path = 'static/' + filename
        print(path)
        return app.send_static_file('bundle.js')
    @app.route('/static/css/<filename>')
    def main_css(filename):
        return app.send_static_file('bundle.css')
    with app.app_context():
        db.create_all()

    return app
