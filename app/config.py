import os

######################################################
# CONFIG PARAMS
######################################################

class Base(object):
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', '')
    if SQLALCHEMY_DATABASE_URI == '':
        SQLALCHEMY_DATABASE_URI = "postgresql://localhost/sensei"

class TestConfig(Base):
    SQLALCHEMY_DATABASE_URI = "postgresql://localhost/sensei_test"
