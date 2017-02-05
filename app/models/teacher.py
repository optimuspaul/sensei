import json

# Teachers (these are not in the database, but are in TC)
class Teacher(object):

    def __init__(self, attrs):
        self.id = attrs.get('id')
        self.name = attrs.get('first_name')

    @staticmethod
    def get_for_classroom(tc_svc, user, classroom_id):
        # https://www.transparentclassroom.com/api/v1/users.json?classroom_id=735&roles[]=teacher
        body = tc_svc.request('users.json', {'classroom_id': classroom_id, 'roles[]': 'teacher'}, user=user)
        return [Teacher(item) for item in json.loads(body)]

    def as_dict(self):
        return dict(
            id=self.id,
            name=self.name)
