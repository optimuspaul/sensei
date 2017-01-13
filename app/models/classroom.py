import json

# Classrooms (these are not in the database, but are in TC)
class Classroom(object):

    def __init__(self, attrs):
        self.id = attrs.get('id')
        self.name = attrs.get('name')
        self.lesson_set_id = attrs.get('lesson_set_id')

    @staticmethod
    def get_for_user(tc_svc, user):
        body = tc_svc.request('classrooms', user=user)
        return [Classroom(c) for c in json.loads(body)]

    def as_dict(self):
        return dict(
            id=self.id,
            name=self.name,
            lesson_set_id=self.lesson_set_id)
