from functools import wraps
from flask import request, Response, g
from app import app

class APIAuthWrapper():
    def auth_service(self):
        return app.config["API_AUTH_SERVICE"]

    def check_auth(self, username, password):
        """This function is called to check if a username /
        password combination is valid.
        """
        res = self.auth_service().check_auth(username, password)
        #if res.error:
        #    print "Error checking auth: %s" % res.error
        return res.authenticated

    def authenticate(self):
        """Sends a 401 response that enables basic auth"""
        return Response(
        'Could not verify your access level for that URL.\n'
        'You have to login with proper credentials', 401,
        {'WWW-Authenticate': 'Basic realm="Login Required"'})

    def requires_auth(self, f):
        @wraps(f)
        def decorated(*args, **kwargs):
            auth = request.authorization
            if not auth or not self.check_auth(auth.username, auth.password):
                return self.authenticate()
            return f(*args, **kwargs)
        return decorated
