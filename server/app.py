from gevent import monkey
monkey.patch_all()

from flask import send_from_directory

from utils.app_builder import AppBuilder
from utils.extensions import socketio, cors, db, server_session, bcrypt
from controllers.room_controller import room_bp
from controllers.auth_controller import auth_bp
from config import ProductionConfig
import sockets.room_events
from dotenv import load_dotenv
import cloudinary
import os

load_dotenv()

app = (
    AppBuilder()
        .create_app(__name__)
        .configure(ProductionConfig)
            .set_static_folder("../client/dist")
            .set_static_url_path("/")
        .register_bp(room_bp, "/api/room")
        .register_bp(auth_bp, "/api/auth")
        .build()
)

cors.init_app(app, supports_credentials=True)
socketio.init_app(app, max_http_buffer_size=15 * 1024 * 1024, cors_allowed_origins="*")
bcrypt.init_app(app)
db.init_app(app)
server_session.init_app(app)

with app.app_context():
    db.create_all()

cloudinary.config(
    cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key = os.getenv('CLOUDINARY_API_KEY'),
    api_secret = os.getenv('CLOUDINARY_API_SECRET'),
    secure = True
)

@app.route("/")
def index():
    return send_from_directory(app.static_folder, "index.html")

@app.route("/<path:path>")
def soporte(path):
    # verificar si archivos fisicos existen en dist
    if os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, "index.html")

if __name__ == "__main__":
    socketio.run(app, debug=True)