from flask import jsonify
import json, gzip
from sqlalchemy import or_, and_
from ..models import *
import dateutil.parser
import StringIO
from datetime import datetime, timedelta
from tzlocal import get_localzone

AVG_THRESHOLD = 0.70
TIME_DIFF_THRESHOLD = 300
TIME_DIFF_DENOMINATOR = 10.0

def generate_interaction_periods_for_relationship(rel, start_time, end_time):
    inverse_relationship = EntityRelationship.query.filter(
        EntityRelationship.classroom_id==rel.classroom_id,
        EntityRelationship.entity2_type==rel.entity1_type,
        EntityRelationship.entity2_id==rel.entity1_id,
        EntityRelationship.entity1_type==rel.entity2_type,
        EntityRelationship.entity1_id==rel.entity2_id
    ).first()

    obs = RadioObservation.query.filter(
            RadioObservation.classroom_id==rel.classroom_id,
            or_(
                RadioObservation.relationship==rel,
                RadioObservation.relationship==inverse_relationship
            ),
            RadioObservation.observed_at >= start_time,
            RadioObservation.observed_at <= end_time,
          ).distinct(RadioObservation.observed_at).order_by(RadioObservation.observed_at.asc()).all()


    ips = []
    cutoff_idx = 0
    if len(obs) > 0:
        print "%d obs for classroom_id %d, %s %d -> %s %d (from %s to %s)" % (len(obs), rel.classroom_id, rel.entity1_type, rel.entity1_id, rel.entity2_type, rel.entity2_id, start_time.isoformat(), end_time.isoformat())
        prev_marker = obs[0].observed_at
        avg = 0
        for idx, ob in enumerate(obs[1:]):
            time_diff = (ob.observed_at-prev_marker).seconds
            if time_diff == 0:
                time_diff = 1
            idx_diff = idx - cutoff_idx
            prev_avg = avg
            avg = idx_diff / (time_diff/TIME_DIFF_DENOMINATOR)
            if avg < AVG_THRESHOLD or idx == len(obs)-2:
                if idx_diff > 0 and prev_avg >= AVG_THRESHOLD:
                    actual_time_diff = (obs[idx].observed_at - prev_marker).seconds
                    if actual_time_diff > TIME_DIFF_THRESHOLD:
                        ip = InteractionPeriod(
                                rel.classroom_id,
                                prev_marker.isoformat(),
                                obs[idx].observed_at.isoformat(),
                                rel)
                        ips.append(ip)
                        print "%d interaction periods" % len(ips)
                cutoff_idx = idx
                prev_marker = ob.observed_at
    return ips


def generate_interaction_periods(classroom_id, start_time, end_time):

    relationships = EntityRelationship.query.filter(
        EntityRelationship.classroom_id==classroom_id
    ).all()

    print "%d relationships for classroom_id %d" % (len(relationships), classroom_id)

    ips = []

    for rel in relationships:
        periods = generate_interaction_periods_for_relationship(rel, start_time, end_time)
        ips.extend(periods)
    return ips
