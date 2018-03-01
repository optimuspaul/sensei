
class DataPublisher(object):
    def __init__(self):
        self.listeners = []

    def publish(self, data_type, data):
        for listener in self.listeners:
            listener.handle(data_type, data)

    def register_listener(self, listener):
        self.listeners.append(listener)

data_publisher = DataPublisher()
