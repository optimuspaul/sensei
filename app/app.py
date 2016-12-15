from flask import Flask
from flask_bootstrap import Bootstrap
from flask_sqlalchemy import SQLAlchemy
from tc_auth_service import TCAuthService

app = Flask(__name__)

app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["API_AUTH_SERVICE"] = TCAuthService('http://localhost:3000/api/v1/authenticate.json')

Bootstrap(app)

# Define the database object to be imported by models and controllers
db = SQLAlchemy(app)
