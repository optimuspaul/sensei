import unittest
import datetime
import json
from main import create_app
from base64 import b64encode
from auth_service import AuthCheckResult
from models import *

class MockAuthService():
    def check_auth(self, username, password):
        if username == 'testuser' and password == 'testpass':
            return AuthCheckResult(True)
        else:
            return AuthCheckResult(False)

class ApiTestCase(unittest.TestCase):
    def setUp(self):
        # Configure app and create a test_client
        app = create_app('app.config.TestConfig')
        app.app_context().push()
        self.app = app.test_client()

        # propagate the exceptions to the test client
        self.app.testing = True
        app.config['DEBUG'] = True

        # Authorization header to use when authorized
        self.authorized_headers = {
            'Authorization': 'Basic ' + b64encode("testuser:testpass")
        }

        # Use mock auth service
        app.config["API_AUTH_SERVICE"] = MockAuthService()
        db.create_all()

    def tearDown(self):
        db.session.remove()
        db.drop_all()

    def api_post_json(self, path, data, auth=False):
        if auth:
            headers = self.authorized_headers
        else:
            headers = None

        return self.app.post('/api/v1/' + path,
            data=data, follow_redirects=True,
            content_type='application/json',
            headers = headers)

    def test_upload_without_auth(self):

        proximity_event = dict(
            classroom_id=1,
            local_id=1,
            remote_id=2,
            observed_at=datetime.datetime.now().isoformat(),
        )

        event_data = json.dumps([proximity_event])
        result = self.api_post_json('proximity_events', event_data)
        self.assertEqual(result.status_code, 401)

    def test_upload_with_auth(self):
        proximity_event = dict(
            classroom_id=1,
            local_id=1,
            remote_id=2,
            observed_at=datetime.datetime.now().isoformat(),
        )
        event_data = json.dumps([proximity_event])
        result = self.api_post_json('proximity_events', event_data, True)
        self.assertEqual(result.status_code, 201)
        events = ProximityEvent.query.all()
        self.assertEqual(len(events), 1)

    def test_mapping_create(self):
        mapping_item = dict(
            classroom_id=1,
            sensor_id=1,
            mapping_type='student',
            target_id=5, # student_id
        )
        result = self.api_post_json('sensor_mappings', json.dumps(mapping_item), True)
        self.assertEqual(result.status_code, 201)
        mappings = SensorMapping.query.all()
        self.assertEqual(len(mappings), 1)

    def test_mapping_update(self):
        mapping1 = dict(
            classroom_id=1,
            sensor_id=1,
            mapping_type='student',
            target_id=5, # student_id
        )
        result = self.api_post_json('sensor_mappings', json.dumps(mapping1), True)
        self.assertEqual(result.status_code, 201)
        mappings = SensorMapping.query.all()
        self.assertEqual(len(mappings), 1)

        mapping2 = dict(
            classroom_id=1,
            sensor_id=1,
            mapping_type='student',
            target_id=5, # student_id
        )
        result = self.api_post_json('sensor_mappings', json.dumps(mapping2), True)
        self.assertEqual(result.status_code, 201)
        mappings = SensorMapping.query.all()
        self.assertEqual(len(mappings), 2)

    def test_get_mappings(self):
        m = SensorMapping(1, 1, datetime.datetime.now(), None, 'student', 1)
        db.session.add(m)
        db.session.commit()
        result = self.app.get('/api/v1/sensor_mappings?classroom_id=1', headers=self.authorized_headers)
        self.assertEqual(result.status_code, 200)
        mappings = json.loads(result.data)
        self.assertEqual(len(mappings), 1)

    def test_area_create(self):
        area = dict(
            classroom_id=1,
            name='test',
        )
        result = self.api_post_json('areas', json.dumps(area), True)
        self.assertEqual(result.status_code, 201)
        areas = Area.query.all()
        self.assertEqual(len(areas), 1)
        self.assertEqual(areas[0].name, "test")

if __name__ == '__main__':
    unittest.main()
