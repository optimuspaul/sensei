#!/usr/bin/env python

from app import main
from app.models import db,RadioObservation,InteractionPeriod
from app.analysis import *
import time
from datetime import datetime, timedelta
from tzlocal import get_localzone

app = main.create_app('app.config.Base')
app.app_context().push()


firebase = app.config.get("FIREBASE_SERVICE")

events_ref = firebase.db.collection('classrooms/2/radioObservations/01-24-18/events')
docs = events_ref.get()

for doc in docs:
    print(u'{} => {}'.format(doc.id, doc.to_dict()))