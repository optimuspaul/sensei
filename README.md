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

1. `npm install`

1. `npm install webpack -g`

1. `python run.py`

1. `webpack --watch`

1. Go to http://localhost:5000/

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
