#!/usr/bin/env python

import json
import urllib, urllib2, base64
import math
import numpy as np
from numpy.linalg import norm
import random
from transitions import Machine
import time
from datetime import datetime, timedelta

SENSEI_SERVER = 'http://localhost:5000/'
SENSEI_API = SENSEI_SERVER + 'api/v1/'
SENSEI_USER = 'super@example.com'
SENSEI_PASSWORD = 'password'
CLASSROOM_ID = 1

def api_req(endpoint, params=None):
    url = SENSEI_API + endpoint
    if params:
        url += '?' + urllib.urlencode(params)
    req = urllib2.Request(url)
    print "calling req: %s" % url
    base64string = base64.b64encode('%s:%s' % (SENSEI_USER, SENSEI_PASSWORD))
    req.add_header("Authorization", "Basic %s" % base64string)
    req.add_header('Content-Type', 'application/json')
    return req

class RadioObservation(object):

    class RSSI(float):
        def __repr__(self):
            return '%.02f' % self

    def __init__(self, classroom_id, local_id, remote_id, observed_at, rssi):
        self.classroom_id = classroom_id
        self.local_id = local_id
        self.remote_id = remote_id
        self.observed_at = observed_at
        self.rssi = RadioObservation.RSSI(rssi)

def trial(prob):
    return random.random() < prob

class Room(object):
    def __init__(self, width, length):
        self.width = width
        self.length = length
        self.trays = []

    def add_tray(self, tray):
        self.trays.append(tray)

    def available_materials(self):
        return [material for tray in self.trays for material in tray.materials if material.available]

    def random_pos(self):
        return np.array([
            (random.random() * self.width) - self.width/2.0,
            (random.random() * self.length) - self.length/2.0])

class Sensor(object):
    RF_COLLISION_PROB = 0.25
    RSSI_AT_1M = -60

    # http://electronics.stackexchange.com/questions/83354/calculate-distance-from-rssi
    def rssi_at_distance(self, distance):
        prop_constant = 3
        return -10 * prop_constant * math.log10(distance) + Sensor.RSSI_AT_1M

    def distance_to(self, other):
        return norm(other.pos - self.pos)

    def sim_ping(self, other):
        if trial(Sensor.RF_COLLISION_PROB):
            return None  # Collision simulated
        d = self.distance_to(other)
        # Limit distance to > 0.1
        if d < 0.1:
            d = 0.1
        rssi = self.rssi_at_distance(d)
        # Simulate random attenuation
        return rssi - abs(np.random.normal(0, 10))

class Teacher(Sensor):
    def __init__(self, room, user_id, sensor_id):
        self.room = room
        self.pos = room.random_pos()
        self.user_id = user_id
        self.sensor_id = sensor_id

class Student(Sensor):
    # probability in a given step while idle/observing, of deciding
    # to take out a new material
    MATERIAL_CHOOSE_PROB = 0.03

    # Probability in a given step while working of finishing or deciding
    # to stop working
    WORKING_STOP_PROB = 0.03

    SPEED = 1 # distance in meters per step
    states = ['observing', 'fetching material', 'moving to workplace',
              'working', 'returning material']

    def __init__(self, room, student_id, sensor_id):
        self.room = room
        self.pos = room.random_pos()
        self.student_id = student_id
        self.sensor_id = sensor_id

        self.material = None # Material that student wants or is using
        self.workplace = None  # Location student brings material to to work on
        self.work_duration = None  # Number of sim steps student engaged for

        # State machine
        self.machine = Machine(model=self, states=Student.states, initial='observing')

        # transitions
        self.machine.add_transition(trigger='wonder', source='observing',
            dest='fetching material', conditions=['has_work_idea'], after='choose_material')
        self.machine.add_transition(trigger='arrived_at_material', source='fetching material',
            dest='moving to workplace', before='take_out_material', after='find_workplace')
        self.machine.add_transition(trigger='arrived_at_workplace', source='moving to workplace',
            dest='working')
        self.machine.add_transition(trigger='work_finished', source='working', dest='returning material')
        self.machine.add_transition(trigger='returned_to_tray', source='returning material',
            dest='observing', before='return_material')

    def __str__(self):
        rval = "%d %d - %s, (%.02f,%.02f)" % (self.sensor_id, self.student_id, self.state, self.pos[0], self.pos[1])
        if self.material is not None:
            rval += " - %s" % self.material.name
        return rval

    def has_work_idea(self):
        return len(self.room.available_materials()) > 0 and trial(Student.MATERIAL_CHOOSE_PROB)

    def choose_material(self):
        self.material = random.choice(self.room.available_materials())
        self.material.available = False

    def take_out_material(self):
        self.material.take_out()

    def find_workplace(self):
        self.workplace = self.room.random_pos()

    def return_material(self):
        self.material.available = True
        self.material.put_back()
        self.material = None

    # Returns True if at target
    def move_toward(self, target):
        # Move towards target at SPEED
        move = target - self.pos
        distance = norm(move)
        if distance > Student.SPEED:
            move = move/norm(move) * Student.SPEED
        self.pos += move
        # Have we arrived?
        return norm(self.pos - target) < .5

    def step(self):
        if self.state == 'observing':
            self.wonder()

        elif self.state == 'fetching material':
            if self.move_toward(self.material.pos):
                self.arrived_at_material()

        elif self.state == 'moving to workplace':
            if self.move_toward(self.workplace):
                self.arrived_at_workplace()
            self.material.pos = self.pos

        elif self.state == 'working':
            if trial(Student.WORKING_STOP_PROB):
                self.work_finished()

        elif self.state == 'returning material':
            arrived = self.move_toward(self.material.home_tray.pos)
            self.material.pos = self.pos
            if arrived:
                self.returned_to_tray()


class MaterialTray(Sensor):
    def __init__(self, room, sensor_id):
        self.pos = room.random_pos()
        self.materials = []
        self.sensor_id = sensor_id
        room.add_tray(self)

    def add_material(self, material):
        self.materials.append(material)

    def remove_material(self, material):
        self.materials.remove(material)

class Material(Sensor):
    def __init__(self, tray, material_id, sensor_id):
        self.home_tray = tray
        self.pos = tray.pos
        self.material_id = material_id
        self.sensor_id = sensor_id
        tray.add_material(self)
        self.available = True

    def take_out(self):
        self.home_tray.remove_material(self)

    def put_back(self):
        self.home_tray.add_material(self)


r = Room(7,18)

def get_sensor_mappings():
    req = api_req('sensor_mappings', {'classroom_id': CLASSROOM_ID})
    response = urllib2.urlopen(req)
    return json.loads(response.read())

sensors = get_sensor_mappings()

students = [Student(r, s['entity_id'], s['sensor_id']) for s in sensors if s['entity_type'] == 'student']

tray0 = MaterialTray(r, 20)
tray1 = MaterialTray(r, 21)
tray2 = MaterialTray(r, 23)
trays = [tray0, tray1, tray2]

materials = [Material(trays[idx%len(trays)], m['entity_id'], m['sensor_id']) for idx,m in enumerate(sensors) if m['entity_type'] == 'material']

teachers = [Teacher(r, t['entity_id'], t['sensor_id']) for t in sensors if t['entity_type'] == 'teacher']

sensors = students + teachers + trays + materials


# Start sim at 8am yesterday
sim_time = datetime.now() - timedelta(days=1)
sim_time = sim_time.replace(hour=8, minute=0, second=0)
end_time = sim_time + timedelta(hours=8)

# Example upload of sensor ob
def upload_obs(obs):
    print "Uploading simulated radio observations."
    req = api_req('radio_observations')
    response = urllib2.urlopen(req, json.dumps(obs))
    print response.read()

while sim_time < end_time:
    print "*" * 80
    print "sim_time = %s" % sim_time
    for student in students:
        student.step()

    # Print current state
    for student in students:
        print str(student)

    # Gather pings
    obs = []
    for sensor in sensors:
        for other in sensors:
            if sensor.sensor_id == other.sensor_id:
                continue
            rssi = sensor.sim_ping(other)
            if rssi is not None:
                event = RadioObservation(CLASSROOM_ID, sensor.sensor_id,
                            other.sensor_id, sim_time.isoformat(), rssi)
                obs.append(event)
    print "%d obs" % len(obs)

    # upload obs
    obs = map(lambda x: x.__dict__, obs)
    upload_obs(obs)

    #time.sleep(1)
    sim_time = sim_time + timedelta(seconds=10)
