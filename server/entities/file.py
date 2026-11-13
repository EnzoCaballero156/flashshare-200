from utils.extensions import db
from uuid import uuid4

class File(db.Model):
    __tablename__ = "files"

    id = db.Column(db.Text, primary_key=True, default=lambda: uuid4().hex)
    room_id = db.Column(db.Text, db.ForeignKey("rooms.id"), nullable=False)
    message_id = db.Column(db.Text, db.ForeignKey("messages.id"), nullable=False)

    name = db.Column(db.String(150), nullable=False)
    url = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(20), nullable=False)
    size = db.Column(db.BigInteger, nullable=False, default=0)

    room = db.relationship("Room", back_populates="files")
    message = db.relationship("Message", back_populates="files")
