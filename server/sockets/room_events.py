from utils.extensions import socketio

from repositories.message.message_repository import MessageRepository
from repositories.file.file_repository import FileRepository
from repositories.room.room_repository import RoomRepository
from repositories.room_member.room_member_repository import RoomMemberRepository

from services.message_service import MessageService
from services.room_member_service import RoomMemberService
from services.room_service import RoomService
from services.file_service import FileService
from services.cloudinary_service import CloudinaryService

from flask import session, request
from flask_socketio import join_room, leave_room, close_room

message_repository = MessageRepository()
file_repository = FileRepository()
room_repository = RoomRepository()
room_member_repository = RoomMemberRepository()

cloudinary_service = CloudinaryService()
message_service = MessageService(message_repository, room_repository)
room_member_service = RoomMemberService(room_member_repository, room_repository)
room_service = RoomService(room_repository)
file_service = FileService(message_repository, room_repository, file_repository, cloudinary_service)

# Envíos de mensajes en tiempo real vía Socket.io
@socketio.on("message")
def message(data):
    room = data.get("room")
    username = data.get("username")
    content = data.get("data", "")
    uploaded = data.get("files", [])

    try:    
        files_data = file_service.add_files(room, uploaded)
        files = file_service.format_files(files_data)
        new_message = message_service.send(username, room, content, files_data)
        message_data = message_service.format_message(new_message, files)
        socketio.emit("message", message_data, to=room)
    except Exception as e:
        socketio.emit("error", {"error": str(e)}, to=request.sid)

# Evento para unir al usuario a la sala por WebSockets
@socketio.on("join_room")
def on_join(data):
    room = data.get("room")
    username = data.get("username")

    try:
        join_room(room)
        room_member_service.join(username, room)
        message = message_service.send(username, room, "entró a la sala.", [])
        join_msg = message_service.format_message(message, [])
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
            cloudinary_service.clear_files(room)
            room_service.delete(room)
        else:
            room_member_service.leave(username, room)
            message = message_service.send(username, room, "se retiró de la sala.", [])
            leave_msg = message_service.format_message(message, [])
            socketio.emit("message", leave_msg, to=room)
            leave_room(room)

        print("Un usuario se desconectó del socket")
    except Exception as e:
        socketio.emit("error", {"error": str(e)}, to=request.sid)