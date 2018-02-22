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
    API_AUTH_SERVICE = TCAuthService(TC_URL)
    TC_SERVICE = TCService(TC_URL)
    
    FIREBASE_SERVICE = FirebaseService(FIREBASE_URL, {
      'private_key': os.getenv('FIREBASE_PRIVATE_KEY', False),
      'client_email': os.getenv('FIREBASE_CLIENT_EMAIL', ''),
      'type': 'service_account',
      'token_uri': 'https://accounts.google.com/o/oauth2/token',
      'project_id': os.getenv('FIREBASE_PROJECT_ID', 'sensei-b9fb6'),
      'private_key_id': os.getenv('FIREBASE_PRIVATE_KEY_ID'),
      'client_id': os.getenv('FIREBASE_CLIENT_ID'),
      'auth_uri': 'https://accounts.google.com/o/oauth2/auth',
      'token_uri': 'https://accounts.google.com/o/oauth2/token',
      'auth_provider_x509_cert_url': 'https://www.googleapis.com/oauth2/v1/certs',
      'client_x509_cert_url': os.getenv('FIREBASE_CLIENT_X509_CERT_URL')
    })
    SENSEI_AWS_PROFILE = os.getenv('SENSEI_AWS_PROFILE', '')

class TestConfig(Base):
    SQLALCHEMY_DATABASE_URI = "postgresql://localhost/sensei_test"
    SQLALCHEMY_ECHO = False
    API_AUTH_SERVICE = MockAuthService()
    TC_SERVICE = MockTCService()
    FIREBASE_SERVICE = MockFirebaseService('test', 'test')
