import boto3
from flask import current_app, jsonify, g, redirect
from shared import *
from sqlalchemy import or_, and_
from ..models import *

@api.route('/api/v1/camera_data/signed_url/<path:key>', methods = ['GET'])
# @api_auth.requires_auth
def camera_data_image(key):

  s3 = get_s3_client()

  url = s3.generate_presigned_url(
      ClientMethod='get_object',
      Params={
          'Bucket': 'wf-camera',
          'Key': key
      }
  )

  return redirect(url, code=302)

# Camera Data - index #
@api.route('/api/v1/camera_data', methods = ['GET'])
# @api_auth.requires_auth
def camera_data_index():

  s3 = get_s3_client()

  output = {}

  s3_folder_name = request.args.get('s3_folder_name')
  if not s3_folder_name:
    result = s3.list_objects(Bucket='wf-camera', Delimiter='/')
    
    for o in result.get('CommonPrefixes'):
      s3_folder_name = o.get('Prefix')[:-1]
      if not output.get(s3_folder_name):
        output[s3_folder_name] = {}
      result = s3.list_objects(Bucket='wf-camera', Delimiter='/', Prefix=o.get('Prefix'))
      for o in result.get('CommonPrefixes'):
        camera = o.get('Prefix').split('/')[1]
        if not output[s3_folder_name].get(camera):
          output[s3_folder_name][camera] = {}
        result = s3.list_objects(Bucket='wf-camera', Delimiter='/', Prefix=o.get('Prefix'))
        for o in result.get('CommonPrefixes'):
          date = o.get('Prefix').split('/')[2]
          output[s3_folder_name][camera][date] = {}
    return jsonify(output)

  date = request.args.get('date')
  if not date:
    date = '2017-08-10'



  cameras = ['1','2']

  output[s3_folder_name] = {}
  for camera in cameras:

    paginator = s3.get_paginator('list_objects')
    operation_parameters = {'Bucket':'wf-camera', 
                            'Prefix': s3_folder_name + '/' + camera + '/' + date}
    pageresponse = paginator.paginate(**operation_parameters)
    
    for page in pageresponse:
      for file in page["Contents"]:
        print(file["Key"])
        parts = file["Key"].split("/")
        if not output[s3_folder_name].get(parts[1]):
          output[s3_folder_name][parts[1]] = {}
        if not output[s3_folder_name].get(parts[1]).get(parts[2]):
          output[s3_folder_name][parts[1]][parts[2]] = []
        output[s3_folder_name][parts[1]][parts[2]].append(file["Key"])
    
  return jsonify(output)


# Sensor Mapping - index #
@api.route('/api/v1/camera_data/segments', methods = ['GET'])
@api_auth.requires_auth
def camera_segments_index():
  s3_folder_name = request.args.get('s3_folder_name')
  if not s3_folder_name:
    abort(400, "Missing s3_folder_name parameter")

  start_time = assert_iso8601_time_param('start_time')
  end_time = assert_iso8601_time_param('end_time')
  
  segments = CameraSegment.query.filter(
        CameraSegment.s3_folder_name==s3_folder_name,
        CameraSegment.start_time >= start_time,
        CameraSegment.end_time <= end_time
    ).all()

  return jsonify([s.as_dict() for s in segments])


# Sensor Mapping - create/update #
@api.route('/api/v1/camera_data/segments', methods=['POST'])
# @api_auth.requires_auth
def create_camera_segment():

  segment_data = request.get_json()

  sensor1_id = segment_data.get('sensor1_id')
  if not sensor1_id:
    abort(400, "Missing sensor1_id parameter")
  sensor2_id = segment_data.get('sensor2_id')
  if not sensor2_id:
    abort(400, "Missing sensor2_id parameter")
  s3_folder_name = segment_data.get('s3_folder_name')
  if not s3_folder_name:
    abort(400, "Missing s3_folder_name parameter")
  start_time = segment_data.get('start_time')
  if not start_time:
    abort(400, "Missing start_time parameter")
  end_time = segment_data.get('end_time')
  if not end_time:
    abort(400, "Missing end_time parameter")
  classroom_id = segment_data.get('classroom_id')
  
  start_time = assert_iso8601_time(start_time)
  end_time = assert_iso8601_time(end_time)

  new_camera_segment = CameraSegment(
    classroom_id,
    s3_folder_name,
    start_time,
    end_time,
    sensor1_id,
    sensor2_id 
  )
  db.session.add(new_camera_segment)

  db.session.commit()
  return "OK", 201



def assert_iso8601_time(datestring):
    timestamp = dateutil.parser.parse(datestring)
    if timestamp.tzinfo != None:
        timestamp = timestamp.astimezone(pytz.utc).replace(tzinfo=None)
    return timestamp

def get_s3_client():
  profile = current_app.config.get("SENSEI_AWS_PROFILE")
  print('profile: ' + profile)
  if profile:
    session = boto3.Session(profile_name=profile)
  else:
    session = boto3.Session()
  s3 = session.client('s3')
  return s3