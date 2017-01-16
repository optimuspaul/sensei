#!/usr/bin/env python

import json
import urllib, urllib2, base64
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


def get_obs_data():
    start_time = datetime.now() - timedelta(days=1)
    start_time = start_time.replace(hour=8, minute=0, second=0)
    end_time = start_time + timedelta(hours=8)


    params = {
        'classroom_id': CLASSROOM_ID,
        'child_id': 2,
        'start_time': start_time,
        'end_time': end_time
    }
    req = api_req('radio_observations', params)
    response = urllib2.urlopen(req)
    return json.loads(response.read())

print "obs = %s" % get_obs_data()
