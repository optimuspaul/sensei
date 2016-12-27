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

        # Use mock auth service
        app.config["API_AUTH_SERVICE"] = MockAuthService()
        db.create_all()

    def tearDown(self):
        db.session.remove()
        db.drop_all()

    def test_upload_without_auth(self):

        proximity_event = data=dict(
            classroom_id=1,
            local_id=1,
            remote_id=2,
            observed_at=datetime.datetime.now().isoformat(),
        )

        event_data = json.dumps([proximity_event])
        result = self.app.post('/api/v1/sensor_proximity_events',
            data=event_data, follow_redirects=True, content_type='application/json')
        self.assertEqual(result.status_code, 401)

    def test_upload_with_auth(self):
        proximity_event = data=dict(
            classroom_id=1,
            local_id=1,
            remote_id=2,
            observed_at=datetime.datetime.now().isoformat(),
        )
        headers = {
            'Authorization': 'Basic ' + b64encode("testuser:testpass")
        }
        event_data = json.dumps([proximity_event])
        result = self.app.post('/api/v1/sensor_proximity_events',
            data=event_data, follow_redirects=True,
            content_type='application/json', headers=headers)
        self.assertEqual(result.status_code, 200)
        events = SensorProximityEvent.query.all()
        self.assertEqual(len(events), 1)

if __name__ == '__main__':
    unittest.main()
