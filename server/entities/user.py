from utils.extensions import db
from uuid import uuid4

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Text, primary_key=True, default=lambda: uuid4().hex)

    email = db.Column(db.String(150), nullable=False)
    password = db.Column(db.Text, nullable=False)