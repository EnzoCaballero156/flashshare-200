from entities.message import Message
from repositories.message.imessage_repository import IMessageRepository
from repositories.room.iroom_repository import IRoomRepository

class MessageService:
    def __init__(self, message_repository: IMessageRepository, room_repository: IRoomRepository):
        self.message_repository = message_repository
        self.room_repository = room_repository
    
    def find_all_by_room_id(self, room_id):
        return self.message_repository.find_all_by_room_id(room_id)

    def format_message(self, message, files):
        return {
            "username": message.user,
            "message": message.content,
            "files": files
        }

    def send(self, username, room_code, content, files_data):
        if not username or not room_code or (not content and not files_data):
            raise Exception("Datos incompletos.")

        room = self.room_repository.find_by_code(room_code)

        if room is None:
            raise Exception("La sala no existe.")

        new_message = Message(user=username, content=content, room=room)
        if files_data: new_message.files = files_data

        return self.message_repository.save(new_message)