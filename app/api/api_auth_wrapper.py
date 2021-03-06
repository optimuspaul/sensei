from functools import wraps
from flask import request, Response, g, current_app
from ..models import *
from expiringdict import ExpiringDict
from datetime import timedelta

class APIAuthWrapper():
    def __init__(self):
        max_age = timedelta(minutes=10)
        self.cache = ExpiringDict(max_len=100, max_age_seconds=max_age.seconds)

    def auth_service(self):
        return current_app.config["API_AUTH_SERVICE"]

    def check_auth(self, username, password):
        """This function is called to check if a username /
        password combination is valid.
        """
        res = self.cache.get((username, password))
        if not res:
            res = self.auth_service().check_auth(username, password)
            self.cache[(username, password)] = res
        return res

    def check_token(self, token):
        """This function is called to check if a token is valid.
        """
        res = self.cache.get(token)
        if not res:
            res = self.auth_service().check_token(token)
            self.cache[token] = res
        return res

    def need_authentication_response(self):
        """Sends a 401 response that enables basic auth"""
        return Response(
            'Could not verify your access level for that URL.\n'
            'You have to login with proper credentials', 401,
            {'WWW-Authenticate': 'Basic realm="Login Required"'})

    def error_response(self, error):
        """Sends a 500 response that indicates server error"""
        return Response("Error checking auth: %s" % error, 500)

    def requires_auth(self, f):
        @wraps(f)
        def decorated(*args, **kwargs):

            if request.headers.get('X-SenseiToken'):
                res = self.check_token(request.headers.get('X-SenseiToken'))
            else:
                auth = request.authorization
                if not auth:
                    return self.need_authentication_response()
                res = self.check_auth(auth.username, auth.password)

            if res.authenticated:
                g.user = User(res.userinfo)
                return f(*args, **kwargs)

            return Response("Unauthorized", 401)

        return decorated
