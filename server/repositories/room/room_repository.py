from .iroom_repository import IRoomRepository
from entities.room import Room
from utils.extensions import db

class RoomRepository(IRoomRepository):
    def find_all(self):
        return Room.query.all()

    def find_by_id(self, id):
        return Room.query.filter_by(id=id).first()

    def find_by_code(self, code):
        return Room.query.filter_by(code=code).first()

    def save(self, entity):
        db.session.add(entity)
        db.session.commit()
        return entity

    def delete(self, entity):
        db.session.delete(entity)
        db.session.commit()
        return True