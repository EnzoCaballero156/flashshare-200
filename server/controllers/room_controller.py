from flask import Blueprint, jsonify, request, session

from repositories.room.room_repository import RoomRepository
from services.room_service import RoomService

room_bp = Blueprint("room_bp", __name__)

room_repository = RoomRepository()
room_service = RoomService(room_repository)

@room_bp.post("/")
def join():
    data = request.get_json()
    username = data.get("username")
    code = data.get("code")

    print("llegó acá")

    if not username:
        return jsonify({"error": "Ingrese un nombre/apodo."}), 401

    if not code:
        return jsonify({"error": "Ingrese un código de sala."}), 401

    print("pasó acá ibeenn")
    room = room_service.find_by_code(code)

    if room is None:
        return jsonify({"error": "La sala no existe."}), 404

    session["room"] = code
    session["username"] = username

    room_members = [member.username for member in room.members]
    
    return jsonify({
        "message": "Te uniste a la sala.", 
        "room": code, 
        "roomName": room.name,
        "isHost": False,
        "host": room.host,
        "members": room_members,
        "expiresAt": room.expiresAt
    })

# Ruta para crear la sala (FUNCIONA BIEN)
@room_bp.post("/create")
def create_room():
    data = request.get_json()
    print("acá bacán")
    username = data.get("username")
    room_name = data.get("roomName")

    print(username, room_name)

    if not username:
        return jsonify({"error": "Ingrese un nombre/apodo."}), 401
    
    if not room_name:
        return jsonify({"error": "Ingrese un nombre de sala."}), 401

    new_room = room_service.create(room_name, username)

    session["room"] = new_room.code
    session["username"] = username

    print(new_room.code, new_room.name, username, new_room.members, new_room.host, new_room.expiresAt)
    return jsonify({
        "message": "Sala creada.", 
        "room": new_room.code, 
        "roomName": new_room.name,
        "isHost": True,
        "host": username,
        "members": new_room.members,
        "expiresAt": new_room.expiresAt
    })

# Ruta para obtener los archivos de la sala
@room_bp.get("/room/files/<room_code>")
def show_files(room_code):
    room = room_service.find_by_code(room_code)
    if room is None:
        return jsonify({"error": "Sala no encontrada."}), 404

    return jsonify({
        "files": [
            {
                "name": file.name,
                "url": file.url,
                "type": file.type,
                "size": file.size
            } for file in room.files
        ]
    })

