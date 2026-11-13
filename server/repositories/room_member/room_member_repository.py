from .iroom_member_repository import IRoomMemberRepository
from entities.room_member import RoomMember
from utils.extensions import db

class RoomMemberRepository(IRoomMemberRepository):
    def find_all(self):
        return RoomMember.query.all()

    def find_by_id(self, id):
        return RoomMember.query.filter_by(id=id).first()

    def find_all_by_room_id(self, room_id):
        return RoomMember.query.filter_by(room_id=room_id).all()

    def find_by_username_and_room_id(self, username, room_id):
        return RoomMember.query.filter_by(username=username, room_id=room_id).first()

    def save(self, entity):
        db.session.add(entity)
        db.session.commit()
        return entity

    def delete(self, entity):
        db.session.delete(entity)
        db.session.commit()
        return True