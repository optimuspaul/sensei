from app import main
from app.models import db
import os

port = int(os.environ.get("PORT", 5000))
app = main.create_app('config.BaseConfig')
app.config['DEBUG'] = True
app.run(host='0.0.0.0', port=port)
