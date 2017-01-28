import json
import urllib2, base64
from auth_service import AuthCheckResult

class TCAuthService():
    def __init__(self, tc_url):
        # https://www.transparentclassroom.com/api/v1/authenticate.json
        self.endpoint = tc_url + '/api/v1/authenticate.json'

    def do_req(self, req):
        req.add_header('Content-Type', 'application/json')
        try:
            response = urllib2.urlopen(req)
        except urllib2.HTTPError as e:
            if e.code == 401:
                return AuthCheckResult(False)
            else:
                raise e
        else:
            body = response.read()
            userinfo = json.loads(body)
            return AuthCheckResult(True, userinfo)

    def check_auth(self, username, password):
        req = urllib2.Request(self.endpoint)
        base64string = base64.b64encode('%s:%s' % (username, password))
        req.add_header("Authorization", "Basic %s" % base64string)
        return self.do_req(req)

    def check_token(self, token):
        req = urllib2.Request(self.endpoint)
        req.add_header("X-TransparentClassroomToken", token)
        return self.do_req(req)
