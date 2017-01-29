import os
from test_mocks import MockAuthService, MockTCService
from tc_auth_service import TCAuthService
from tc_service import TCService

######################################################
# CONFIG PARAMS
######################################################

class Base(object):
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', "postgresql://localhost/sensei")
    TC_URL = os.getenv('TC_URL', 'http://localhost:3000')
    API_AUTH_SERVICE = TCAuthService(TC_URL)
    TC_SERVICE = TCService(TC_URL)

class TestConfig(Base):
    SQLALCHEMY_DATABASE_URI = "postgresql://localhost/sensei_test"
    SQLALCHEMY_ECHO = False
    API_AUTH_SERVICE = MockAuthService()
    TC_SERVICE = MockTCService()
