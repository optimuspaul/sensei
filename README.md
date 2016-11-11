# Sensei: Sensing Educational Interaction

## Web Application

If you're new to Flask and SQLAlchemy:
Flask: http://flask.pocoo.org/
SQLAlchemy: http://flask-sqlalchemy.pocoo.org/2.1/

Getting started:

1. clone the repo and cd to it

1. run virtualenv venv && source venv/bin/activate if you want

1. run pip install -r requirements.txt

1. Ask Pete to be added to the Heroku app as a collaborator

1. Download the Heroku toolbelt and run heroku login

1. `export DATABASE_URL=$(heroku config:get DATABASE_URL -a sensei-server)`

1. `python run.py`

1. Go to http://localhost:5000/
