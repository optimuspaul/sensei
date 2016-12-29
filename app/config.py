import os

######################################################
# CONFIG PARAMS
######################################################

class Base(object):
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', "postgresql://localhost/sensei")
    TC_URL = os.getenv('TC_URL', 'http://localhost:3000')

class TestConfig(Base):
    SQLALCHEMY_DATABASE_URI = "postgresql://localhost/sensei_test"
