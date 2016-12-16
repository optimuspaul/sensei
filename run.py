from app import main
from app.models import db
import os

port = int(os.environ.get("PORT", 5000))
app = main.create_app('app.config.Base')
port = os.environ.get("PORT")
app.config['DEBUG'] = os.environ.get("PRODUCTION_MODE", "False") != "True"
app.run(host='0.0.0.0', port=port)
