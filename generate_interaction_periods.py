from app import main
from app.models import db,RadioObservation,InteractionPeriod
from app.analysis import *
import time
from datetime import datetime, timedelta
from tzlocal import get_localzone

app = main.create_app('app.config.Base')
app.app_context().push()



app.config.get("TC_SERVICE")
tc = app.config.get("TC_SERVICE")
classroom_ids = RadioObservation.query.group_by(RadioObservation.classroom_id).with_entities(RadioObservation.classroom_id).all()
for cid in classroom_ids:

    ip = InteractionPeriod.query.filter(
                InteractionPeriod.classroom_id==cid
            ).order_by(InteractionPeriod.ended_at.desc()).first()
    now = datetime.now(get_localzone())
    if ip:
      most_recent = (ip.ended_at + timedelta(hours=8))
    else:
      most_recent = (datetime.now() + timedelta(days=-1))

    obs = RadioObservation.query.filter(
                    RadioObservation.classroom_id==cid,
                    RadioObservation.observed_at >= most_recent
                  ).all()

    if len(obs) > 0:
        generate_interaction_periods(cid, most_recent.isoformat(), now.isoformat())



