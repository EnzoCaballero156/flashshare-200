from ..base.irepository import IRepository
from abc import abstractmethod

class IFileRepository(IRepository):
    @abstractmethod
    def find_all_by_room_id(self, room_id):
        pass