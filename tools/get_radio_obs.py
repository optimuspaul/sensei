#!/usr/bin/env python

if __name__ == '__main__' and __package__ is None:
    from os import sys, path
    sys.path.append(path.dirname(path.dirname(path.abspath(__file__))))

from app import main
from app.models import db,RadioObservation
import time
from datetime import datetime, timedelta
import os
import json

app = main.create_app('app.config.Base')
app.app_context().push()

CLASSROOM_ID = os.environ.get("CLASSROOM_ID", 123)

# start_time and end_time are in UTC
start_time = datetime(2017, 11, 28, 14)
end_time = start_time + timedelta(hours=2)

timestep = start_time
while timestep <= end_time:
    obs = RadioObservation.query.filter(
                    RadioObservation.classroom_id==CLASSROOM_ID,
                    RadioObservation.observed_at==timestep
                  ).all()

    if len(obs) > 0:
        output = json.dumps([o.as_dict_for_web_resource() for o in obs])
        filename = timestep.strftime("radio_obs_%Y%m%d_%H%M%S.json")
        print("Writing %d obs to %s" % (len(obs), filename))
        with open(filename, 'w') as the_file:
            the_file.write(output)
    else:
        print "No obs for classroom %s at time %s" % (CLASSROOM_ID, timestep)

    timestep += timedelta(seconds=10)
