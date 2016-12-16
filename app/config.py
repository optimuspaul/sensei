import os

######################################################
# CONFIG PARAMS
######################################################

class BaseConfig:
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', '')
    if SQLALCHEMY_DATABASE_URI == '':
        SQLALCHEMY_DATABASE_URI = "postgresql://localhost/sensei"

class TestConfig(BaseConfig):
    SQLALCHEMY_DATABASE_URI = "postgresql://localhost/sensei_test"
