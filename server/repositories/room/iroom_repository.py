from ..base.irepository import IRepository
from abc import abstractmethod

class IRoomRepository(IRepository):
    @abstractmethod
    def find_by_code(self, code):
        pass