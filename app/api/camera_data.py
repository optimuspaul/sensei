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
          'Bucket': 'wf-classroom-data',
          'Key': key
      }
  )

  return redirect(url, code=302)

# Camera Data - index #
@api.route('/api/v1/camera_data', methods = ['GET'])
@api_auth.requires_auth
def camera_data_index():

  tc = current_app.config.get("TC_SERVICE")
  classrooms = Classroom.get_for_user(tc, g.user)

  user = User.get_tc_info(tc, g.user)


  print "user: %s" % user

  permitted_buckets = [];

  firebase = current_app.config.get("FIREBASE_SERVICE")
  classroom_ref = firebase.db.collection('cameras')
  cameraDocs = classroom_ref.get()

  camera_mappings = {}
  

  for doc in cameraDocs:
    camera = doc.to_dict()
    print "camera: %s, classroomId: %s" % (camera, camera.get("classroomId"))
    if ('admin' in user.get("roles")) or camera.get("classroomId") in user.get("accessible_classroom_ids"):
      if camera.get("bucketName") not in permitted_buckets:
        permitted_buckets.append(camera.get("bucketName"))
    camera_mappings[camera.get("bucketName")] = camera.get("classroomId")
  
  print "permitted_buckets: %s" % permitted_buckets
  print "camera_mappings: %s" % camera_mappings

  s3 = get_s3_client()

  output = {}

  

  
  
  result = s3.list_objects(Bucket='wf-classroom-data', Delimiter='/')

  for o in result.get('CommonPrefixes'):
    location = o.get('Prefix')[:-1]
    
    if not location in permitted_buckets:
      continue
    if not output.get(location):
      output[location] = {}
    result = s3.list_objects(Bucket='wf-classroom-data', Delimiter='/', Prefix=o.get('Prefix'))
    for o in result.get('CommonPrefixes'):
      camera = o.get('Prefix').split('/')[1]
      if camera != '2D-pose':
        output[location]['classroom_id'] = camera_mappings[location]
        if not output[location].get(camera):
          output[location][camera] = {}
        result = s3.list_objects(Bucket='wf-classroom-data', Delimiter='/', Prefix=o.get('Prefix'))
        for o in result.get('CommonPrefixes'):
          date = o.get('Prefix').split('/')[2]
          if not output[location][camera].get(date):
            output[location][camera][date] = {}
          result = s3.list_objects(Bucket='wf-classroom-data', Delimiter='/', Prefix=o.get('Prefix'))
          for o in result.get('CommonPrefixes'):
            vantage_point = o.get('Prefix').split('/')[3]
            output[location][camera][date][vantage_point] = []

  s3_folder_name = request.args.get('s3_folder_name')
  if not s3_folder_name:
    return jsonify(output)

  date = request.args.get('date')
  if not date:
    date = '2017-08-10'

# https://s3.amazonaws.com/wf-classroom-data/camera-wildflower/camera/2017-11-21/camera01/still_2017-11-21-09-06-20.jpg


  print "output: %s" % output
  print "s3_folder_name: %s" % s3_folder_name
  print "output[s3_folder_name]: %s" % output[s3_folder_name]
  print "output[s3_folder_name].keys(): %s" % output[s3_folder_name].keys()

  


  prefix = s3_folder_name + '/camera/' + date + '/camera01'
  

  paginator = s3.get_paginator('list_objects')
  operation_parameters = {'Bucket':'wf-classroom-data',
                          'Prefix': prefix}
  pageresponse = paginator.paginate(**operation_parameters)

  for page in pageresponse:
    
    for file in page.get("Contents", []):
      
      parts = file["Key"].split("/")
      if not output[s3_folder_name].get(parts[1]):
        output[s3_folder_name][parts[1]] = {}
      if not output[s3_folder_name].get(parts[1]).get(parts[2]):
        output[s3_folder_name][parts[1]][parts[2]] = {}
      if not output[s3_folder_name].get(parts[1]).get(parts[2]):
        output[s3_folder_name][parts[1]][parts[2]][parts[3]] = []
      output[s3_folder_name][parts[1]][parts[2]][parts[3]].append(file["Key"])


  return jsonify(output)


# @api.route('/api/v1/camera_data/segments', methods = ['GET'])
# @api_auth.requires_auth
# def camera_segments_index():
#   s3_folder_name = request.args.get('s3_folder_name')
#   if not s3_folder_name:
#     abort(400, "Missing s3_folder_name parameter")

#   start_time = assert_iso8601_time_param('start_time')
#   end_time = assert_iso8601_time_param('end_time')

#   segments = CameraSegment.query.filter(
#         CameraSegment.s3_folder_name==s3_folder_name,
#         CameraSegment.start_time >= start_time,
#         CameraSegment.end_time <= end_time
#     ).all()

#   return jsonify([s.as_dict() for s in segments])

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



@api.route('/api/v1/camera_data/segments', methods=['POST'])
@api_auth.requires_auth
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
