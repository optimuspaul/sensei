from app import main
from app.models import db
import os
from flask_swagger_ui import get_swaggerui_blueprint

port = int(os.environ.get("PORT", 5000))
app = main.create_app('app.config.Base')

# Setup swagger
SWAGGER_URL = '/api/docs'  # URL for exposing Swagger UI (without trailing '/')
API_URL = '/static/docs/api.yaml'  # Our API url (can of course be a local resource)
swaggerui_blueprint = get_swaggerui_blueprint(
    SWAGGER_URL,  # Swagger UI static files will be mapped to '{SWAGGER_URL}/dist/'
    API_URL,
    config={  # Swagger UI config overrides
        'supportedSubmitMethods': ['get', 'post', 'put', 'delete'],
        'docExpansion': "list",
    }
)
app.register_blueprint(swaggerui_blueprint, url_prefix=SWAGGER_URL)

port = int(os.environ.get("PORT"))
app.config['DEBUG'] = os.environ.get("PRODUCTION_MODE", "False") != "True"

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=port)
