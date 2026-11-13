from utils.extensions import db
from uuid import uuid4

class Room(db.Model):
    __tablename__ = "rooms"

    id = db.Column(db.Text, primary_key=True, default=lambda: uuid4().hex)

    code = db.Column(db.String(4), nullable=False)
    name = db.Column(db.String(150), nullable=False)
    host = db.Column(db.String(150), nullable=False)
    expiresAt = db.Column(db.BigInteger, nullable=False)

    members = db.relationship("RoomMember", back_populates="room", cascade="all, delete-orphan")
    messages = db.relationship("Message", back_populates="room", cascade="all, delete-orphan")
    files = db.relationship("File", back_populates="room", cascade="all, delete-orphan")