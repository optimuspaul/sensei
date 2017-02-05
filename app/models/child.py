import json

# Children (these are not in the database, but are in TC)
class Child(object):

    def __init__(self, attrs):
        self.id = attrs.get('id')
        last_name = attrs.get('last_name')[0] + '.'
        self.name = attrs.get('first_name') + " " + last_name

    @staticmethod
    def get_for_classroom(tc_svc, user, classroom_id):
        # https://www.transparentclassroom.com/api/v1/children.json?classroom_id=735
        body = tc_svc.request('children.json', {'classroom_id': classroom_id}, user=user)
        return [Child(item) for item in json.loads(body)]

    def as_dict(self):
        return dict(
            id=self.id,
            name=self.name)
