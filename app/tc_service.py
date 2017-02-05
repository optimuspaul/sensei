import urllib2
import urllib

#self.Model = type('Model', (), dict(svc=self))

class TCService():

    def __init__(self, tc_url):
        self.api_url = tc_url + '/api/v1/'

    def request(self, path, params=None, user=None):
        url = self.api_url + path
        if params:
            url += '?' + urllib.urlencode(params)
        req = urllib2.Request(url)
        if user:
            req.add_header("X-TransparentClassroomToken", user.api_token)
        req.add_header('Content-Type', 'application/json')
        response = urllib2.urlopen(req)
        return response.read()
