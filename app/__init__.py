from flask import Flask, request, session, g, redirect, url_for, abort, render_template, flash
from flask_sqlalchemy import SQLAlchemy
from flask import render_template
import re
#from parse_data_to_db import *

app = Flask(__name__)

# TODO: select config based on environment
app.config.from_object('config.BaseConfig')
app.config['DEBUG'] = True

# Define the database object to be imported by models and controllers
db = SQLAlchemy(app)

from models import *

# API #

@app.route('/api/v1/sensor_proximity_events', methods=['POST'])
def post_sensor_proximity_events():
    # TODO: auth
    event_data = request.get_json()
    if not isinstance(event_data, list):
        event_data = [event_data]
    for event in event_data:
        db.session.add(SensorProximityEvent(
            event.get('school_id'),
            event.get('local_id'),
            event.get('remote_id'),
            event.get('observed_at'),
            event.get('rssi')))
    db.session.commit()
    return "%d" % len(event_data)

# TEMPLATES #

@app.route('/', methods=['GET', 'POST'])
def login():
    error = None
    if session.get('logged_in'):
         return redirect(url_for('home'))
    if request.method == 'POST':
        usernames = User.query.filter_by(username=request.form['username']).first()
        if usernames is None:
            error = "Invalid username"
        else:
            users = User.query.filter_by(username=request.form['username'], password=request.form['password']).first()
            if users is None:
                error = "Invalid password"
            else:
                session['logged_in'] = True
                session['username'] = request.form['username']
                flash('You were logged in')
                return redirect(url_for('home'))
        return render_template('index.html', error=error)
    return render_template('index.html', error=error)

@app.route('/logout')
def logout():
    session.pop('logged_in', None)
    flash('You were logged out')
    return redirect(url_for('login'))

@app.route("/home")
def home():
    school_id = 1
    school_name = "Wildflower"
    return render_template('home.html', school=school_name)

@app.route("/customize_updates")
def customize_updates():
    return render_template('customize_updates.html')

@app.route('/students')
def students():
    primary_student = request.values.get('student', None)
    if primary_student:
        #entries = SocialProximity.query.filter_by(primary_person=primary_student)
        return render_template('students.html', entries=None, primary_student=primary_student)
    else:
        #entries = SocialProximity.query.all()
        return render_template('students.html', entries=None, primary_student=None)

@app.route('/teachers')
def teachers():
    return render_template('teachers.html')

@app.route('/materials')
def materials():
    return render_template('materials.html')

@app.route('/classroom')
def classroom():
    return render_template('classroom.html')

@app.route('/notes')
def notes():
    return render_template('notes.html')

@app.route('/students_total')
def students_total():
    return render_template('students_total.html')
