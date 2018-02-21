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




class MockFirestoreObject():
    def set(self, ref=True, data=True, opts=True):
        return True
    def commit(self):
        return True
    def update(self, data=True, opts=True):
        return True

class MockFirebaseAdmin():
    def batch(self):
        return MockFirestoreObject()
    def document(self, path='test'):
        return MockFirestoreObject()

class MockFirebaseService():  
    def __init__(self, databaseURL=True, cert_path=True):
        self.url = databaseURL
        self.cert_path = cert_path
        self.db = MockFirebaseAdmin()