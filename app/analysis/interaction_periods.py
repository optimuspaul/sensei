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
TIME_DIFF_DENOMINATOR = 10

def generate_interaction_periods(classroom_id, start, end):
   
    mappings = SensorMapping.query.filter(
        SensorMapping.classroom_id==classroom_id
    ).all()
    ips = []

    print "%d mappings" % len(mappings)

    start_time = assert_iso8601_time_param(start)
    end_time = assert_iso8601_time_param(end)

    for mapping in mappings:

        relationships = EntityRelationship.query.filter(
            EntityRelationship.classroom_id==classroom_id,
            EntityRelationship.entity1_type==mapping.entity_type,
            EntityRelationship.entity1_id==mapping.entity_id
        ).order_by(EntityRelationship.entity2_type.asc(),
                   EntityRelationship.entity2_id.asc()).all()
        
        print "%d relationships" % len(relationships)

        earliest_timestamp = None
        latest_timestamp = None
        for idx, rel in enumerate(relationships):
            inverse_relationship = EntityRelationship.query.filter(
                EntityRelationship.classroom_id==classroom_id,
                EntityRelationship.entity2_type==rel.entity1_type,
                EntityRelationship.entity2_id==rel.entity1_id,
                EntityRelationship.entity1_type==rel.entity2_type,
                EntityRelationship.entity1_id==rel.entity2_id
            ).first()
            
            obs = RadioObservation.query.filter(
                    RadioObservation.classroom_id==classroom_id,
                    or_(
                        RadioObservation.relationship==rel,
                        RadioObservation.relationship==inverse_relationship
                    ),
                    RadioObservation.observed_at >= start_time,
                    RadioObservation.observed_at <= end_time,
                  ).distinct(RadioObservation.observed_at).order_by(RadioObservation.observed_at.asc()).all()

            print "%d obs from %s to %s" % (len(obs), start_time.isoformat(), end_time.isoformat())

            cutoff_idx = 0
            if len(obs) > 0:
                prev_marker = obs[0].observed_at
                avg = 0
                for idx, ob in enumerate(obs[1:]):
                    time_diff = (ob.observed_at-prev_marker).seconds
                    if time_diff == 0:
                        time_diff = 1
                    idx_diff = idx - cutoff_idx
                    prev_avg = avg
                    avg = idx_diff / (time_diff/TIME_DIFF_DENOMINATOR)
                    if avg < AVG_THRESHOLD:
                        if idx_diff > 0 and prev_avg >= AVG_THRESHOLD:
                            actual_time_diff = (obs[idx].observed_at - prev_marker).seconds
                            if actual_time_diff > TIME_DIFF_THRESHOLD:
                                ip = InteractionPeriod(
                                        classroom_id,
                                        prev_marker.isoformat(), 
                                        obs[idx].observed_at.isoformat(),
                                        rel)
                                print "classroom_id: %s, started_at %s, ended_at %s, relationship: %s" % (classroom_id, prev_marker.isoformat(),  obs[idx].observed_at.isoformat(), rel)
                                ips.append(ip)
                                print "%d ips" % len(ips)
                                if latest_timestamp is None or latest_timestamp < obs[idx].observed_at:
                                    latest_timestamp = obs[idx].observed_at
                                if earliest_timestamp is None or earliest_timestamp > prev_marker:
                                    earliest_timestamp = prev_marker
                        cutoff_idx = idx
                        prev_marker = ob.observed_at
    print "%d ips" % len(ips)
    if len(ips) > 0:
        print "bulk storing observations"
        InteractionPeriod.bulk_store(ips)


def assert_iso8601_time_param(datestring):
    timestamp = dateutil.parser.parse(datestring)
    if timestamp.tzinfo != None:
        timestamp = timestamp.astimezone(pytz.utc).replace(tzinfo=None)
    return timestamp