from utils.app_builder import AppBuilder
from utils.extensions import socketio, cors, db
from controllers.room_controller import room_bp
from config import DevelopmentConfig
import sockets.room_events
from dotenv import load_dotenv
import cloudinary
import os

load_dotenv()

app = (
    AppBuilder()
        .create_app(__name__)
        .configure(DevelopmentConfig)
        .register_bp(room_bp, "")
        .build()
)

cors.init_app(app, supports_credentials=True)
socketio.init_app(app, max_http_buffer_size=15 * 1024 * 1024, cors_allowed_origins="*")
db.init_app(app)

with app.app_context():
    db.create_all()

cloudinary.config(
    cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key = os.getenv('CLOUDINARY_API_KEY'),
    api_secret = os.getenv('CLOUDINARY_API_SECRET'),
    secure = True
)

if __name__ == "__main__":
    socketio.run(app, debug=True)