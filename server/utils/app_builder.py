from flask import Flask

class AppBuilder:
    def __init__(self):
        self.app = None

    def create_app(self, file):
        self.app = Flask(file)
        return self
    
    def set_static_folder(self, static_folder):
        self.app.static_folder = static_folder
        return self
    
    def set_static_url_path(self, static_url_path):
        self.app.static_url_path = static_url_path
        return self
    
    def configure(self, object):
        self.app.config.from_object(object)
        return self
    
    def register_bp(self, blueprint, url_prefix):
        self.app.register_blueprint(blueprint, url_prefix=url_prefix)
        return self
    
    def build(self):
        return self.app