from utils.extensions import socketio

from repositories.message.message_repository import MessageRepository
from repositories.file.file_repository import FileRepository
from repositories.room.room_repository import RoomRepository
from repositories.room_member.room_member_repository import RoomMemberRepository

from services.message_service import MessageService
from services.room_member_service import RoomMemberService
from services.room_service import RoomService

from flask import session, request
from flask_socketio import join_room, leave_room, close_room
from werkzeug.utils import secure_filename

import cloudinary.utils
import cloudinary.uploader
import cloudinary.api

message_repository = MessageRepository()
file_repository = FileRepository()
room_repository = RoomRepository()
room_member_repository = RoomMemberRepository()

message_service = MessageService(message_repository, room_repository, file_repository)
room_member_service = RoomMemberService(room_member_repository, room_repository, message_repository)
room_service = RoomService(room_repository)

# Envíos de mensajes en tiempo real vía Socket.io
@socketio.on("message")
def message(data):
    room = data.get("room")
    username = data.get("username")
    content = data.get("data", "")
    uploaded = data.get("files", [])

    print(f"contenido del mensaje: {content}")

    try:    
        files = message_service.send(username, room, content, uploaded)

        message_data = {
            "username": username,
            "message": content,
            "files": files
        }
        
        socketio.emit("message", message_data, to=room)
    except Exception as e:
        socketio.emit("error", {"error": str(e)}, to=request.sid)

# Evento para unir al usuario a la sala por WebSockets
@socketio.on("join_room")
def on_join(data):
    room = data.get("room")
    username = data.get("username")
    print(" se imprimio bien aca en el socket,", room, username)
    try:
        print("vamos a hacer room member service join a ver que tal")
        message = room_member_service.join(username, room)
        join_room(room)

        print("hasta aca bacan en join room")
        join_msg = {
            "username": message.user,
            "message": message.content,
            "files": []
        }

        print(join_msg)

        session["room"] = room
        session["username"] = username
        socketio.emit("message", join_msg, to=room)
    except Exception as e:
        socketio.emit("error", {"error": str(e)}, to=request.sid)

@socketio.on("disconnect")
def disconnect():
    room = session.get("room")
    username = session.get("username")

    target = room_service.find_by_code(room)

    if not room or target is None:
        return
    try:
        if target.host == username:
            socketio.emit("close_room", to=room, include_self=False)
            close_room(room)
            for tipo in ["image", "video", "raw"]:
                cloudinary.api.delete_resources_by_prefix(f"files/{room}R_", resource_type=tipo)
            room_service.delete(room)
        else:
            message = room_member_service.leave(username, room)
            leave_msg = {
                "username": message.user,
                "message": message.content,
                "files": []
            }
            socketio.emit("message", leave_msg, to=room)
            leave_room(room)

        print("Un usuario se desconectó del socket")
    except Exception as e:
        socketio.emit("error", {"error": str(e)}, to=request.sid)