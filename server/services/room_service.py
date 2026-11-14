from entities.room import Room
from repositories.room.iroom_repository import IRoomRepository
import time
import random

class RoomService:
    def __init__(self, room_repository: IRoomRepository):
        self.room_repository = room_repository

    def __generate_code(self, rooms):
        room_codes = {room.code for room in rooms}
        while True:
            code = ""
            for _ in range(6):
                code += str(random.randint(0, 9))

            if code in room_codes:
                continue
            break
        return code
    
    def find_by_code(self, code):
        return self.room_repository.find_by_code(code)

    def create(self, name, host):
        if not name or not host:
            raise Exception("Datos incompletos.")
        code = self.__generate_code(self.room_repository.find_all())
        
        room = Room(code=code, name=name, host=host, expiresAt=time.time() + 3600)
        return self.room_repository.save(room)

    def delete(self, code):
        room = self.room_repository.find_by_code(code)

        if room is None:
            raise Exception("Sala no encontrada.")
        
        return self.room_repository.delete(room)