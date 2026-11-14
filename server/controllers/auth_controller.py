from flask import Blueprint, request, jsonify, session
from repositories.user.user_repository import UserRepository
from services.auth_service import AuthService
from utils.extensions import bcrypt

auth_bp = Blueprint('auth_bp', __name__)

user_repository = UserRepository()
auth_service = AuthService(user_repository)

@auth_bp.get('/@me')
def get_current_session():
    user_id = session.get("user_id")
    print(user_id)

    if user_id is None:
        return jsonify({"error": "No autorizado."}), 401
    
    user = auth_service.cargar_sesion(user_id)

    return jsonify({
        'id': user.id,
        'email': user.email
    }) 

@auth_bp.post('/register')
def register():
    email = request.json['email']
    password = request.json['password']

    if auth_service.usuario_existe(email): 
        return jsonify({'error': 'El usuario ya existe.'}), 409

    hashed_password = bcrypt.generate_password_hash(password).decode("utf-8") # decode para postgresql
    nuevo_usuario = auth_service.registrar_usuario(email, hashed_password)
    print(nuevo_usuario.id)
    session['user_id'] = nuevo_usuario.id
    session.permanent = True
    session.modified = True

    return jsonify({
        "id": nuevo_usuario.id,
        "email": nuevo_usuario.email
    })
    
@auth_bp.post('/login')
def login():
    email = request.json['email']
    password = request.json['password']
    usuario = auth_service.iniciar_sesion(email)

    if usuario is None or not bcrypt.check_password_hash(usuario.password, password):
        return jsonify({"error": "No autorizado."}), 401

    session['user_id'] = usuario.id
    session.permanent = True
    session.modified = True

    return jsonify({
        "id": usuario.id,
        "email": usuario.email
    })

@auth_bp.post('/logout')
def logout():
    session.pop("user_id")
    return jsonify({
        "mensaje": "Sesión cerrada."
    })