import os
from test_mocks import MockAuthService, MockTCService, MockFirebaseService
from tc_auth_service import TCAuthService
from tc_service import TCService
from firebase_service import FirebaseService

######################################################
# CONFIG PARAMS
######################################################

class Base(object):
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', "postgresql://localhost/sensei")
    TC_URL = os.getenv('TC_URL', 'http://localhost:3000')
    FIREBASE_URL = os.getenv('FIREBASE_URL', 'https://sensei-b9fb6.firebaseio.com')
    FIREBASE_CERT = os.getenv('FIREBASE_CERT', 'sensei-b9fb6-firebase-adminsdk-dn9oq-8794bfa2a5.json')
    API_AUTH_SERVICE = TCAuthService(TC_URL)
    TC_SERVICE = TCService(TC_URL)
    FIREBASE_SERVICE = FirebaseService(FIREBASE_URL, FIREBASE_CERT)
    SENSEI_AWS_PROFILE = os.getenv('SENSEI_AWS_PROFILE', '')

class TestConfig(Base):
    SQLALCHEMY_DATABASE_URI = "postgresql://localhost/sensei_test"
    SQLALCHEMY_ECHO = False
    API_AUTH_SERVICE = MockAuthService()
    TC_SERVICE = MockTCService()
    FIREBASE_SERVICE = MockFirebaseService('test', 'test')
