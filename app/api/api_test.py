import unittest
from datetime import datetime, timedelta
import json
from ..main import create_app
from base64 import b64encode
from ..models import *

class ApiTestCase(unittest.TestCase):
    def setUp(self):
        # Configure app and create a test_client
        app = create_app('app.config.TestConfig')
        app.app_context().push()
        self.app = app.test_client()

        # propagate the exceptions to the test client
        self.app.testing = True
        app.config['DEBUG'] = True

        # Authorization header to use when authorized
        self.authorized_headers = {
            'Authorization': 'Basic ' + b64encode("testuser:testpass")
        }

        db.create_all()

    def tearDown(self):
        db.session.remove()
        db.drop_all()

    def api_post_json(self, path, data, auth=False):
        if auth:
            headers = self.authorized_headers
        else:
            headers = None

        return self.app.post('/api/v1/' + path,
            data=data, follow_redirects=True,
            content_type='application/json',
            headers = headers)

    def test_upload_without_auth(self):

        radio_ob = dict(
            classroom_id=1,
            local_id=1,
            remote_id=2,
            observed_at=datetime.now().isoformat(),
        )

        event_data = json.dumps([radio_ob])
        result = self.api_post_json('radio_observations', event_data)
        self.assertEqual(result.status_code, 401)

    def test_upload_with_auth(self):
        m = SensorMapping(1, 1, datetime.now(), None, MappingType.child, 1)
        db.session.add(m)
        m = SensorMapping(1, 2, datetime.now(), None, MappingType.child, 2)
        db.session.add(m)
        db.session.commit()
        radio_ob = dict(
            classroom_id=1,
            local_id=1,
            remote_id=2,
            observed_at=datetime.now().isoformat(),
        )
        event_data = json.dumps([radio_ob])
        result = self.api_post_json('radio_observations', event_data, True)
        self.assertEqual(result.status_code, 201)
        events = RadioObservation.query.all()
        self.assertEqual(len(events), 1)

    def test_upload_duplicate(self):
        m = SensorMapping(1, 1, datetime.now(), None, MappingType.child, 1)
        db.session.add(m)
        m = SensorMapping(1, 2, datetime.now(), None, MappingType.child, 2)
        db.session.add(m)
        db.session.commit()

        now = datetime.now()

        radio_ob = dict(
            classroom_id=1,
            local_id=1,
            remote_id=2,
            observed_at=now.isoformat(),
        )
        event_data = json.dumps([radio_ob])
        result = self.api_post_json('radio_observations', event_data, True)

        one_hour_ago = now - timedelta(hours=1)

        radio_ob2 = dict(
            classroom_id=1,
            local_id=2,
            remote_id=1,
            observed_at=now.isoformat(),
        )
        event_data = json.dumps([radio_ob, radio_ob2])
        result = self.api_post_json('radio_observations', event_data, True)
        self.assertEqual(result.status_code, 201)
        events = RadioObservation.query.all()
        self.assertEqual(len(events), 2)

    def test_mapping_create(self):
        mapping_item = dict(
            classroom_id=1,
            sensor_id=1,
            entity_type='child',
            entity_id=5, # child_id
        )
        result = self.api_post_json('sensor_mappings', json.dumps([mapping_item]), True)
        self.assertEqual(result.status_code, 201)
        mappings = SensorMapping.query.all()
        self.assertEqual(len(mappings), 1)

    def test_mapping_update_same_sensor_id(self):
        # When updating the mapping of a sensor, existing mappings to that
        # sensor should be ended
        mappings = [
            dict(
                classroom_id=1,
                sensor_id=1,
                entity_type='child',
                entity_id=5),
            dict(
                classroom_id=1,
                sensor_id=1,
                entity_type='child',
                entity_id=6)]
        result = self.api_post_json('sensor_mappings', json.dumps(mappings), True)
        self.assertEqual(result.status_code, 201)
        mappings = SensorMapping.query.all()
        self.assertEqual(len(mappings), 2)

        mappings = SensorMapping.query.filter_by(end_time=None).all()
        self.assertEqual(len(mappings), 1)
        self.assertEqual(mappings[0].entity_id, 6)

    def test_mapping_update_same_entity(self):
        # When updating a mapping to an entity, existing mappings to that
        # entity should be ended
        mappings = [
            dict(
                classroom_id=1,
                sensor_id=1,
                entity_type='child',
                entity_id=5),
            dict(
                classroom_id=1,
                sensor_id=2,
                entity_type='child',
                entity_id=5)]
        result = self.api_post_json('sensor_mappings', json.dumps(mappings), True)
        self.assertEqual(result.status_code, 201)
        mappings = SensorMapping.query.all()
        self.assertEqual(len(mappings), 2)

        mappings = SensorMapping.query.filter_by(end_time=None).all()
        self.assertEqual(len(mappings), 1)
        self.assertEqual(mappings[0].sensor_id, 2)


    def test_get_mappings(self):
        m = SensorMapping(1, 1, datetime.now(), None, MappingType.child, 1)
        db.session.add(m)
        db.session.commit()
        result = self.app.get('/api/v1/sensor_mappings?classroom_id=1', headers=self.authorized_headers)
        self.assertEqual(result.status_code, 200)
        mappings = json.loads(result.data)
        self.assertEqual(len(mappings), 1)

    def test_area_create(self):
        area = dict(
            classroom_id=1,
            name='test',
        )
        result = self.api_post_json('areas', json.dumps(area), True)
        self.assertEqual(result.status_code, 201)
        areas = Area.query.all()
        self.assertEqual(len(areas), 1)
        self.assertEqual(areas[0].name, "test")

    def test_material_create(self):
        material = dict(
            classroom_id=1,
            name='red rods',
            lesson_id=5
        )
        result = self.api_post_json('materials', json.dumps(material), True)
        self.assertEqual(result.status_code, 201)
        materials = Material.query.all()
        self.assertEqual(len(materials), 1)
        self.assertEqual(materials[0].name, "red rods")

    def test_classrooms_index(self):
        result = self.app.get('/api/v1/classrooms', headers=self.authorized_headers)
        self.assertEqual(result.status_code, 200)
        classrooms = json.loads(result.data)
        self.assertEqual(len(classrooms), 1)
        self.assertEqual(classrooms[0].get('name'), "test classroom")


if __name__ == '__main__':
    unittest.main()
