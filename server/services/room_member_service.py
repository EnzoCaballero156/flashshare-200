from entities.room_member import RoomMember
from entities.message import Message
from repositories.room_member.iroom_member_repository import IRoomMemberRepository
from repositories.room.iroom_repository import IRoomRepository
from repositories.message.imessage_repository import IMessageRepository

class RoomMemberService:
    def __init__(self, room_member_repository: IRoomMemberRepository, room_repository: IRoomRepository, message_repository: IMessageRepository):
        self.room_member_repository = room_member_repository
        self.room_repository = room_repository
        self.message_repository = message_repository
    
    def find_all_by_room_id(self, room_id):
        return self.room_member_repository.find_all_by_room_id(room_id)

    def join(self, username, room_code):
        if not username or not room_code:
            raise Exception("Datos incompletos.")

        room = self.room_repository.find_by_code(room_code)
        if room is None:
            raise Exception("La sala no existe.")

        new_room_member = RoomMember(room=room, username=username)
        join_msg = Message(user=username, content="entró a la sala.", room=room)
        self.room_member_repository.save(new_room_member)

        return self.message_repository.save(join_msg)

    def leave(self, username, room_code):
        if not username or not room_code:
            raise Exception("Datos incompletos.")

        room = self.room_repository.find_by_code(room_code)
        if room is None:
            raise Exception("La sala no existe.")

        member = self.room_member_repository.find_by_username_and_room_id(username, room.id)

        leave_msg = Message(user=username, content="se retiró de la sala.", room=room)
        self.message_repository.save(leave_msg)
        self.room_member_repository.delete(member)
        return leave_msg
        