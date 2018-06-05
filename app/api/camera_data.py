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

  permitted_iam_names = [];

  firebase = current_app.config.get("FIREBASE_SERVICE")
  classroom_iam_names_ref = firebase.db.collection('classroom_iam_names')
  classroom_iam_names = classroom_iam_names_ref.get()

  camera_mappings = {}
  

  for doc in classroom_iam_names:
    classroom_iam_name = doc.to_dict()
    if ('admin' in user.get("roles")) or classroom_iam_name.get("classroom_id") in user.get("accessible_classroom_ids"):
      if classroom_iam_name.get("iam_name") not in permitted_iam_names:
        iam_name = classroom_iam_name.get("iam_name")
        classroom_id = classroom_iam_name.get("classroom_id")
        permitted_iam_names.append(iam_name)
        classroom_ref = firebase.db.document('classrooms/%s' % classroom_id)
        classroom_info = classroom_ref.get().to_dict()
        classroom_info.pop('interactions', None)
        classroom_info['classroom_id'] = classroom_id
        camera_mappings[iam_name] = classroom_info
    

  s3 = get_s3_client()

  output = {}  
  
  result = s3.list_objects(Bucket='wf-classroom-data', Delimiter='/')

  date = request.args.get('date')
  current_date = request.args.get('date')
  current_vantage_point = request.args.get('vantage_point')
  mode = request.args.get('mode')

  for o in result.get('CommonPrefixes'):
    iam_name = o.get('Prefix')[:-1]
    
    if not iam_name in permitted_iam_names:
      continue
    if not output.get(iam_name):
      output[iam_name] = {}
    result = s3.list_objects(Bucket='wf-classroom-data', Delimiter='/', Prefix=o.get('Prefix'))
    for o in result.get('CommonPrefixes'):
      camera = o.get('Prefix').split('/')[1]
      if camera != '2D-pose':
        output[iam_name]['classroom_info'] = camera_mappings[iam_name]
        if not output[iam_name].get(camera):
          output[iam_name][camera] = {}
        result = s3.list_objects(Bucket='wf-classroom-data', Delimiter='/', Prefix=o.get('Prefix'))
        for o in result.get('CommonPrefixes'):
          date = o.get('Prefix').split('/')[2]
          if not output[iam_name][camera].get(date):
            output[iam_name][camera][date] = {}
          result = s3.list_objects(Bucket='wf-classroom-data', Delimiter='/', Prefix=o.get('Prefix'))
          prefixes = result.get('CommonPrefixes')
          if prefixes:
            for o in result.get('CommonPrefixes'):
              vantage_point = o.get('Prefix').split('/')[3]
              output[iam_name][camera][date][vantage_point] = {}

  s3_folder_name = request.args.get('s3_folder_name')

  
  if not s3_folder_name or not date or not current_date or not mode:
    return jsonify(output)

  batch = firebase.db.batch()
  i = 0

  if not current_vantage_point:
    current_vantage_point = 'camera01'

  current_path = 'camera_data/' + s3_folder_name + '/' + mode + '/' + current_date + '/' + current_vantage_point;

  # print 'current_path: %s' % current_path
  photos_ref = firebase.db.collection(current_path)
  photos = photos_ref.get()

  num_photos = 0
  for doc in photos:
    # print doc.to_dict()
    num_photos += 1
  print 'number of photos for %s: %s' % (current_path, num_photos)

  if num_photos > 0:
    return jsonify(output)

  for vantage_point in output[s3_folder_name]['camera'][current_date].keys():

    prefix = s3_folder_name + '/camera/' + current_date + '/' + vantage_point
    
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
          output[s3_folder_name][parts[1]][parts[2]][parts[3]] = {}
        # output[s3_folder_name][parts[1]][parts[2]][parts[3]].append(file["Key"])
        # print file

        path = 'camera_data/%s' % (file["Key"])
        if '.mp4' in path:
          path = path.replace('/camera/', '/video/')
        # print path
        ref = firebase.db.document(path)
        batch.set(ref, {'Key': file["Key"]})
        i += 1
        if i == 500:
          batch.commit()
          i = 0
          batch = firebase.db.batch()

  batch.commit()

  return jsonify(output)


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
