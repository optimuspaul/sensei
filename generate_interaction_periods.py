from app import main
from app.models import db

app = main.create_app('app.config.Base')
app.app_context().push()

relationships = EntityRelationship.query.all();

classroom_id = 2

for rel in relationships:
    obs = RadioObservation.query.filter(
            RadioObservation.classroom_id==classroom_id,
            RadioObservation.relationship==rel,
          ).order_by(RadioObservation.observed_at.asc()).all()

cutoff_idx = 0
prev_marker = obs[0].observed_at
ips = []
for idx, ob in enumerate(obs[1:]):
    time_diff = (ob.observed_at-prev_marker).seconds
    idx_diff = idx - cutoff_idx
    prev_avg = avg
    avg = idx_diff / (time_diff/10.0)
    # print "elapsed seconds:        %d" % time_diff
    # print "observations/s:         %s" % avg
    # print "prev observations/s:    %s" % prev_avg
    # print "index:                  %d" % idx
    # print "observation time:           %s" % ob.observed_at
    # print "index diff:             %d" % idx_diff
    # print "cutoff_idx:             %d" % cutoff_idx
    # print "prev_marker:            %s" % prev_marker
    if avg < 0.70:
        if idx_diff > 0:
            if prev_avg >= 0.7:
                segment_viz = "="*(time_diff/50)
                print "     <%s> %s to %s" % (segment_viz, prev_marker.strftime("%m/%d %H:%M:%S"), obs[idx].observed_at.strftime("%m/%d %H:%M:%S"))
        cutoff_idx = idx
        prev_marker = ob.observed_at
                
                ips.append(InteractionPeriod(
                        classroom.classroom_id,
                        prev_marker,
                        obs[idx-1].observed_at,
                        relationship))
            