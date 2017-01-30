# Sensei: Sensing Educational Interaction

[![Build Status](https://travis-ci.org/WildflowerSchools/sensei.svg?branch=master)](https://travis-ci.org/WildflowerSchools/sensei)

## Web Application

If you're new to Flask and SQLAlchemy:
Flask: http://flask.pocoo.org/
SQLAlchemy: http://flask-sqlalchemy.pocoo.org/2.1/

Getting started:

1. clone the repo and cd to it

1. run `virtualenv venv && source venv/bin/activate` (You will need to source the activate script for other new shells as well)

1. `pip install -r requirements.txt`

1. `npm install -g create-react-app`

1. `cd frontend && npm install && cd ..`

1. `npm install && npm install -g gulp-cli`

1. `npm run postinstall`

1. `python run.py`

1. Go to http://localhost:5000/

## Integrate with Transparent Classroom

1. Go to the Wildflower Network, then Admin -> School Settings.

2.  In the Custom Header box, put the following:

```
<script>window.sensei = {env: {baseUrl: 'http://localhost:5000'}}</script>
<script src="http://localhost:5000/static/bundle.js"></script>
<link rel="stylesheet" type="text/css" href="http://localhost:5000/static/bundle.css">
```

## Running migrations

1. `export FLASK_APP=run.py`

1. `flask db upgrade`

## Running tests

`pytest`

Or to just run tests that match a string:

`pytest -k somestring`

## Deploying to heroku

We use two buildpacks; one for python, one for nodejs

```
heroku buildpacks:add --index 1 heroku/python
heroku buildpacks:add --index 2 heroku/nodejs
```
