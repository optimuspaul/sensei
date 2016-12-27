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

    def test_upload_without_auth(self):

        proximity_event = dict(
            classroom_id=1,
            local_id=1,
            remote_id=2,
            observed_at=datetime.datetime.now().isoformat(),
        )

        event_data = json.dumps([proximity_event])
        result = self.app.post('/api/v1/proximity_events',
            data=event_data, follow_redirects=True, content_type='application/json')
        self.assertEqual(result.status_code, 401)

    def test_upload_with_auth(self):
        proximity_event = dict(
            classroom_id=1,
            local_id=1,
            remote_id=2,
            observed_at=datetime.datetime.now().isoformat(),
        )
        event_data = json.dumps([proximity_event])
        result = self.app.post('/api/v1/proximity_events',
            data=event_data, follow_redirects=True,
            content_type='application/json', headers=self.authorized_headers)
        self.assertEqual(result.status_code, 200)
        events = ProximityEvent.query.all()
        self.assertEqual(len(events), 1)

    def test_mapping_create(self):
        mapping_item = dict(
            classroom_id=1,
            sensor_id=1,
            sensor_type='child',
            target_id=5, # child_id
        )
        result = self.app.post('/api/v1/sensor_mappings',
            data=json.dumps(mapping_item), follow_redirects=True,
            content_type='application/json', headers=self.authorized_headers)
        self.assertEqual(result.status_code, 200)
        mappings = SensorMapping.query.all()
        self.assertEqual(len(mappings), 1)


if __name__ == '__main__':
    unittest.main()
