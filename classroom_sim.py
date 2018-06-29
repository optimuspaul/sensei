#!/usr/bin/env python

import json
import urllib, urllib2, base64
import math
import numpy as np
from numpy.linalg import norm
import random
from transitions import Machine
import time
import os
from datetime import datetime, timedelta
from tzlocal import get_localzone


# This should be updated to use the sensei client library


SENSEI_SERVER = os.environ.get("SENSEI_SERVER", 'http://localhost:5000/')
SENSEI_USER = os.environ.get("SENSEI_USER", 'super@example.com')
SENSEI_PASSWORD = os.environ.get("SENSEI_PASSWORD", 'password')
CLASSROOM_ID = int(os.environ.get("CLASSROOM_ID", "2"))

def api_req(endpoint, params=None):
    url = SENSEI_SERVER + 'api/v1/' + endpoint
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

class AccelerometerObservation(object):

    def __init__(self, classroom_id, sensor_id, observed_at, accelerations):
        self.classroom_id = classroom_id
        self.sensor_id = sensor_id
        self.observed_at = observed_at
        self.x_acceleration = accelerations[0]
        self.y_acceleration = accelerations[1]
        self.z_acceleration = accelerations[2]

class EntityLocation(object):

    def __init__(self, classroom_id, sensor_id, timestamp, coords, stdDevs):
        self.classroom_id = classroom_id
        self.sensor_id = sensor_id
        self.timestamp = timestamp
        self.x = coords[0]
        self.xStdDev = stdDevs[0]
        self.y = coords[1]
        self.yStdDev = stdDevs[1]

def trial(prob):
    return random.random() < prob

class Room(object):
    def __init__(self, width, length):
        self.width = width
        self.length = length
        self.areas = []

    def add_area(self, area):
        self.areas.append(area)

    def available_materials(self):
        return [material for area in self.areas for material in area.materials if material.available]

    def random_pos(self):
        return np.array([
            (random.random() * self.width),
            (random.random() * self.length)])

class Sensor(object):
    RF_COLLISION_PROB = 0.25
    RSSI_AT_1M = -90

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
        rssi = rssi - abs(np.random.normal(0, 10))
        if rssi < -99:
            rssi = None
        return rssi

    def sim_acceleration(self):
        return (np.random.uniform(-20, 20), np.random.uniform(-20, 20), np.random.uniform(-20, 20))

class Teacher(Sensor):
    def __init__(self, room, sensor_id):
        self.room = room
        self.pos = room.random_pos()
        self.sensor_id = sensor_id

class Child(Sensor):
    # probability in a given step while idle/observing, of deciding
    # to take out a new material
    MATERIAL_CHOOSE_PROB = 0.03

    # Probability in a given step while working of finishing or deciding
    # to stop working
    WORKING_STOP_PROB = 0.03

    SPEED = 1 # distance in meters per step
    states = ['observing', 'fetching material', 'moving to workplace',
              'working', 'returning material']

    def __init__(self, room, sensor_id):
        self.room = room
        self.pos = room.random_pos()
        self.sensor_id = sensor_id

        self.material = None # Material that child wants or is using
        self.workplace = None  # Location child brings material to to work on
        self.work_duration = None  # Number of sim steps child engaged for

        # State machine
        self.machine = Machine(model=self, states=Child.states, initial='observing')

        # transitions
        self.machine.add_transition(trigger='wonder', source='observing',
            dest='fetching material', conditions=['has_work_idea'], after='choose_material')
        self.machine.add_transition(trigger='arrived_at_material', source='fetching material',
            dest='moving to workplace', before='take_out_material', after='find_workplace')
        self.machine.add_transition(trigger='arrived_at_workplace', source='moving to workplace',
            dest='working')
        self.machine.add_transition(trigger='work_finished', source='working', dest='returning material')
        self.machine.add_transition(trigger='returned_to_area', source='returning material',
            dest='observing', before='return_material')

    def __str__(self):
        rval = "%d - %s, (%.02f,%.02f)" % (self.sensor_id, self.state, self.pos[0], self.pos[1])
        if self.material is not None:
            rval += " - Material %s" % self.material.sensor_id
        return rval

    def has_work_idea(self):
        return len(self.room.available_materials()) > 0 and trial(Child.MATERIAL_CHOOSE_PROB)

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
        if distance > Child.SPEED:
            move = move/norm(move) * Child.SPEED
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
            if trial(Child.WORKING_STOP_PROB):
                self.work_finished()

        elif self.state == 'returning material':
            arrived = self.move_toward(self.material.home_area.pos)
            self.material.pos = self.pos
            if arrived:
                self.returned_to_area()


class Area(Sensor):
    def __init__(self, room, sensor_id):
        self.pos = room.random_pos()
        self.materials = []
        self.sensor_id = sensor_id
        room.add_area(self)

    def add_material(self, material):
        self.materials.append(material)

    def remove_material(self, material):
        self.materials.remove(material)

class Material(Sensor):
    def __init__(self, area, sensor_id):
        self.home_area = area
        self.pos = area.pos
        self.sensor_id = sensor_id
        area.add_material(self)
        self.available = True

    def take_out(self):
        self.home_area.remove_material(self)

    def put_back(self):
        self.home_area.add_material(self)


r = Room(20.7,3.8)

def get_sensor_mappings():
    req = api_req('sensor_mappings', {'classroom_id': CLASSROOM_ID})
    response = urllib2.urlopen(req)
    return json.loads(response.read())

sensors = get_sensor_mappings()

children = [Child(r, s['sensor_id']) for s in sensors if s['entity_type'] == 'child']

areas = [Area(r, s['sensor_id']) for s in sensors if s['entity_type'] == 'area']

materials = [Material(areas[idx%len(areas)], m['sensor_id']) for idx,m in enumerate(sensors) if m['entity_type'] == 'material']

teachers = [Teacher(r, t['sensor_id']) for t in sensors if t['entity_type'] == 'teacher']

sensors = children + teachers + areas + materials


# Start sim at 8am yesterday
sim_time = datetime.now(get_localzone()) - timedelta(hours=24)
sim_time = sim_time.replace(hour=8, minute=0, second=0, microsecond=0)
sim_end_time = sim_time + timedelta(hours=7)
end_time = sim_time + timedelta(hours=127)

# Example upload of sensor ob
def upload_obs(obs):
    print "Uploading simulated radio observations."
    req = api_req('radio_observations')
    start_time = time.time()
    response = urllib2.urlopen(req, json.dumps(obs))
    print response.read()
    elapsed_time = time.time() - start_time
    print "Upload took %s seconds" % elapsed_time

def upload_accel_obs(obs):
    print "Uploading simulated accelerometer observations. %s" % json.dumps(obs)
    req = api_req('accelerometer_observations')
    start_time = time.time()
    response = urllib2.urlopen(req, json.dumps(obs))
    print response.read()
    elapsed_time = time.time() - start_time
    print "Upload took %s seconds" % elapsed_time

def upload_entity_locs(obs):
    print "Uploading simulated location observations. %s" % json.dumps(obs)
    req = api_req('entity_locations')
    start_time = time.time()
    response = urllib2.urlopen(req, json.dumps(obs))
    print response.read()
    elapsed_time = time.time() - start_time
    print "Upload took %s seconds" % elapsed_time

while sim_time < end_time:

    if sim_time > sim_end_time:
        sim_time = sim_end_time + timedelta(hours=16)
        sim_end_time = sim_time + timedelta(hours=7)

    print "*" * 80
    print "sim_time = %s" % sim_time
    for child in children:
        child.step()

    # Print current state
    for child in children:
        print str(child)

    # Gather pings
    obs = []
    accel_obs = []
    entity_locs = []
    for sensor in sensors:
        accelerations = sensor.sim_acceleration()
        accel_event = AccelerometerObservation(CLASSROOM_ID, sensor.sensor_id, sim_time.isoformat(), accelerations)
        accel_obs.append(accel_event)
        stdDevs = [np.random.uniform(0, 1), np.random.uniform(0, 1)]
        loc_ob = EntityLocation(CLASSROOM_ID, sensor.sensor_id, sim_time.isoformat(), sensor.pos, stdDevs)
        entity_locs.append(loc_ob)
        for other in sensors:
            if sensor.sensor_id == other.sensor_id:
                print "location: %s " % sensor.pos
                continue
            rssi = sensor.sim_ping(other)
            if rssi is not None:
                event = RadioObservation(CLASSROOM_ID, sensor.sensor_id,
                            other.sensor_id, sim_time.isoformat(), rssi)
                obs.append(event)

    print "%d obs" % len(obs)
    print "%d accel_obs" % len(accel_obs)

    # upload obs
    if len(obs) > 0:
        obs = map(lambda x: x.__dict__, obs)
        upload_obs(obs)

    # upload obs
    if len(accel_obs) > 0:
        accel_obs = map(lambda x: x.__dict__, accel_obs)
        upload_accel_obs(accel_obs)

    if len(entity_locs) > 0:
        entity_locs = map(lambda x: x.__dict__, entity_locs)
        upload_entity_locs(entity_locs)

    time.sleep(0.5)
    sim_time = sim_time + timedelta(seconds=10)
