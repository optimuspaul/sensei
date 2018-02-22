from flask_redis_handle import redis_store
import json

class LocationModelFeeder:
    # Distribute posted data out to work input queues.
    # There is a different queue for each classroom, because
    # the location model maintains state for performance.

    def handle(self, data_type, data):
        print("In LocationModelFeeder.handler")
        if data_type == 'radio_obs_frame' and len(data) > 0:
            json_dicts = [ob.as_dict_for_web_resource() for ob in data]
            serialized_data = json.dumps(json_dicts)
            queue_name = 'radio_obs_classroom_%d' % data[0].classroom_id
            redis_store.lpush(queue_name, serialized_data)
