from flask import request, abort, jsonify
import json, gzip
from sqlalchemy import or_, and_
import numpy as np
from shared import *
from ..models import *
import dateutil.parser
import StringIO


def assert_iso8601_time_param(name):
    datestring = request.args.get(name)
    if not datestring:
        abort(400, "Missing %s parameter" % name)
    return dateutil.parser.parse(datestring)

@api.route('/api/v1/interaction_totals', methods=['GET'])
@api_auth.requires_auth
def interaction_totals_index():
    classroom_id = request.args.get('classroom_id')
    if not classroom_id:
        abort(400, "Missing classroom_id parameter")

    entity_id = request.args.get('entity_id')
    entity_type = request.args.get('entity_type')
    if entity_id:
        entity_id = int(entity_id)
    # else:
    #     abort(400, "Missing entity_id parameter")
    # if not entity_type:
    #     abort(400, "Missing entity_type parameter")

    interaction_type = request.args.get('interaction_type')
    start_time = assert_iso8601_time_param('start_time')
    end_time = assert_iso8601_time_param('end_time')

    output = []
    entities = []
    timestamps = []
    if not entity_id:
        relationships = EntityRelationship.query.filter(
                    EntityRelationship.classroom_id==classroom_id,
                    EntityRelationship.entity1_type==entity_type,
                    EntityRelationship.entity2_type==entity_type
                ).all()
    else:
        if not interaction_type:
            relationships = EntityRelationship.query.filter(
                    EntityRelationship.classroom_id==classroom_id,
                    EntityRelationship.entity1_type==entity_type,
                    EntityRelationship.entity1_id==entity_id
                ).order_by(EntityRelationship.entity2_type.asc(),
                           EntityRelationship.entity2_id.asc()).all()
        else:
            relationships = EntityRelationship.query.filter(
                    EntityRelationship.classroom_id==classroom_id,
                    EntityRelationship.entity1_type==entity_type,
                    EntityRelationship.entity1_id==entity_id,
                    EntityRelationship.entity2_type==interaction_type
                ).order_by(EntityRelationship.entity2_type.asc(),
                           EntityRelationship.entity2_id.asc()).all()

    for rel in relationships:

        it = 0

        interaction_periods = InteractionPeriod.query.filter(
                InteractionPeriod.classroom_id==classroom_id,
                InteractionPeriod.relationship_id==rel.id,
                InteractionPeriod.started_at >= start_time,
                InteractionPeriod.ended_at <= end_time
            ).order_by(InteractionPeriod.started_at.asc()).all()

        for ip in interaction_periods:
            diff = ip.ended_at - ip.started_at
            it += diff.seconds

        if it > 0:
            output.append(it)
            entities.append([rel.entity2_type.value,rel.entity2_id, rel.entity1_type.value, rel.entity1_id])

    if len(output) > 0:
        timestamps = [ start_time, end_time ]
    return jsonify({
        'obs': output,
        'entities': entities,
        'timestamps': timestamps
    })
