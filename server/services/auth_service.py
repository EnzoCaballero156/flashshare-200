from entities.user import User
from repositories.user.iuser_repository import IUserRepository

class AuthService:
    def __init__(self, user_repository: IUserRepository):
        self.user_repository = user_repository

    def usuario_existe(self, email):
        return self.user_repository.find_by_email(email) is not None

    def cargar_sesion(self, user_id):
        return self.user_repository.find_by_id(user_id)

    def registrar_usuario(self, email, password):
        nuevo_usuario = User(email=email, password=password)
        return self.user_repository.save(nuevo_usuario)
    
    def iniciar_sesion(self, email):
        usuario_encontrado = self.user_repository.find_by_email(email)
        return usuario_encontrado