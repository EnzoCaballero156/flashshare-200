from utils.extensions import db
from uuid import uuid4

class RoomMember(db.Model):
    __tablename__ = "room_members"

    id = db.Column(db.Text, primary_key=True, default=lambda: uuid4().hex)
    room_id = db.Column(db.Text, db.ForeignKey("rooms.id"), nullable=False)

    username = db.Column(db.String(150), nullable=False)

    room = db.relationship("Room", back_populates="members")
