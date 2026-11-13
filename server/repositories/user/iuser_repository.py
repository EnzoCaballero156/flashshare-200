from ..base.irepository import IRepository
from abc import abstractmethod

class IUserRepository(IRepository):
    @abstractmethod
    def find_by_email(self, email):
        pass

    @abstractmethod
    def find_by_email_and_password(self, email, password):
        pass

    @abstractmethod
    def exists_by_id(self, id):
        pass

    @abstractmethod
    def exists_by_email(self, email):
        pass

    @abstractmethod
    def exists_by_email_and_password(self, email, password):
        pass