from utils.extensions import db
from uuid import uuid4

class Message(db.Model):
    __tablename__ = "messages"

    id = db.Column(db.Text, primary_key=True, default=lambda: uuid4().hex)
    room_id = db.Column(db.Text, db.ForeignKey("rooms.id"), nullable=False)

    user = db.Column(db.String(150), nullable=False)
    content = db.Column(db.Text, nullable=False, default="")

    files = db.relationship("File", back_populates="message", cascade="all, delete-orphan")
    room = db.relationship("Room", back_populates="messages")
