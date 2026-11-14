from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_socketio import SocketIO
from flask_cors import CORS
from flask_session import Session

db = SQLAlchemy()
bcrypt = Bcrypt()
socketio = SocketIO()
cors = CORS()
server_session = Session()