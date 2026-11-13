from ..base.irepository import IRepository
from abc import abstractmethod

class IRoomMemberRepository(IRepository):
    @abstractmethod
    def find_all_by_room_id(self, room_id):
        pass

    @abstractmethod
    def find_by_username_and_room_id(self, username, room_id):
        pass