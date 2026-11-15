from entities.room_member import RoomMember
from repositories.room_member.iroom_member_repository import IRoomMemberRepository
from repositories.room.iroom_repository import IRoomRepository

class RoomMemberService:
    def __init__(self, room_member_repository: IRoomMemberRepository, room_repository: IRoomRepository):
        self.room_member_repository = room_member_repository
        self.room_repository = room_repository
    
    def find_all_by_room_id(self, room_id):
        return self.room_member_repository.find_all_by_room_id(room_id)

    def join(self, username, room_code):
        if not username or not room_code:
            raise Exception("Datos incompletos.")

        room = self.room_repository.find_by_code(room_code)
        if room is None:
            raise Exception("La sala no existe.")

        new_room_member = RoomMember(room=room, username=username)
        self.room_member_repository.save(new_room_member)

    def leave(self, username, room_code):
        if not username or not room_code:
            raise Exception("Datos incompletos.")

        room = self.room_repository.find_by_code(room_code)
        if room is None:
            raise Exception("La sala no existe.")

        member = self.room_member_repository.find_by_username_and_room_id(username, room.id)
        self.room_member_repository.delete(member)
        