from auth_service import AuthCheckResult
import json

class MockAuthService():
    def check_auth(self, username, password):
        if username == 'testuser' and password == 'testpass':
            testuser = dict(
                id=1,
                first_name="Test",
                last_name="User",
                email="user@example.com",
                api_token="exampletoken",
                school_id=1)
            return AuthCheckResult(True, testuser)
        else:
            return AuthCheckResult(False)

class MockTCService():

    def request(self, path, params=None, user=None):
        if path == 'classrooms':
            return json.dumps([dict(
                id=1,
                name='test classroom',
                lesson_set_id=1)])
        if 'users' in path:
            return json.dumps([dict(
                id=1,
                first_name='Joe',
                last_name='Tester')])
        if 'children' in path:
            return json.dumps([dict(
                id=1,
                first_name='Kid',
                last_name='Tester')])
