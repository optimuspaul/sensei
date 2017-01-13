# User
class User(object):
    def __init__(self, userinfo):
        self.id = userinfo['id']
        self.first_name = userinfo['first_name']
        self.last_name = userinfo['last_name']
        self.email = userinfo['email']
        self.api_token = userinfo['api_token']
        self.school_id = userinfo['school_id']

    def as_dict(self):
       return dict(
         id=self.id,
         first_name=self.first_name,
         last_name=self.last_name,
         email=self.email,
         api_token=self.api_token,
         school_id=self.school_id)
