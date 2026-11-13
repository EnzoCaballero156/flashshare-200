from abc import ABC, abstractmethod

class IRepository(ABC):
    @abstractmethod
    def find_all(self):
        pass

    @abstractmethod
    def find_by_id(self, id):
        pass

    @abstractmethod
    def save(self, entity):
        pass

    @abstractmethod
    def delete(self, entity):
        pass