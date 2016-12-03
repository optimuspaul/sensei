

import json
import urllib2, base64

class AuthCheckResult():
    def __init__(self, authenticated, error = None, userinfo = None):
        self.authenticated = authenticated
        self.error = error


# https://www.transparentclassroom.com/api/v1/authenticate.json
class TCAuthService():
    def __init__(self, endpoint):
        self.endpoint = endpoint

    # TODO: Could be caching?
    def check_auth(self, username, password):
        req = urllib2.Request(self.endpoint)
        base64string = base64.b64encode('%s:%s' % (username, password))
        req.add_header("Authorization", "Basic %s" % base64string)
        req.add_header('Content-Type', 'application/json')

        try:
            response = urllib2.urlopen(req)
        except urllib2.HTTPError as e:
            if e.code == 404:
                return AuthCheckResult(False)
            else:
                error = "Unexpected response from server: %s" % e
                return AuthCheckResult(False, error)
        except urllib2.URLError as e:
            error = "Error checking auth: %s" % e
            return AuthCheckResult(False, error)
        else:
            body = response.read()
            userinfo = json.loads(body)
            return AuthCheckResult(True, None, userinfo)
