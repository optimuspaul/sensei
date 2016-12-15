from flask import Flask
from flask_bootstrap import Bootstrap
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
Bootstrap(app)

# Define the database object to be imported by models and controllers
db = SQLAlchemy(app)

# Set up views and endpoints
import api
