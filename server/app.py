from flask import Flask, request, session, jsonify, url_for, send_from_directory
from flask_socketio import join_room, leave_room, send, SocketIO
from flask_cors import CORS
from werkzeug.utils import secure_filename
import random
import os

app = Flask(__name__) 
app.config["SECRET_KEY"] = "amawoawds"

# Se define la carpeta donde se subirán los archivos
UPLOAD_FOLDER = os.path.join(app.root_path, 'files')
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

# CORS para permitir interacción entre el servidor y el frontend
CORS(app, supports_credentials=True)

# Se inicializa socket.io y se aumenta el límite de espacio a 10 MB
socketio = SocketIO(app, max_http_buffer_size=10 * 1024 * 1024, cors_allowed_origins="*")

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Diccionario de salas creadas
rooms = {}

# Generar código aleatorio de 6 dígitos
def generate_code():
    while True:
        code = ""
        for _ in range(6):
            code += str(random.randint(0, 9))

        if code not in rooms:
            break

    return code

# Ruta para unirse a una sala
@app.post("/")
def join():
    data = request.get_json()
    username = data.get("username")
    code = data.get("code")

    if not username:
        return jsonify({"error": "Ingrese un nombre/apodo."}), 401

    if not code:
        return jsonify({"error": "Ingrese un código de sala."}), 401

    if code not in rooms:
        return jsonify({"error": "La sala no existe."}), 404

    session["room"] = code
    session["username"] = username

    return jsonify({
        "message": "Te uniste a la sala.", 
        "room": code, 
        "roomName": rooms[code]["name"],
        "is_host": False,
        "host": rooms[code]["host"]
    })

# Ruta para crear la sala
@app.post("/create")
def create_room():
    data = request.get_json()
    username = data.get("username")
    room_name = data.get("roomName")

    if not username:
        return jsonify({"error": "Ingrese un nombre/apodo."}), 401
    
    if not room_name:
        return jsonify({"error": "Ingrese un nombre de sala."}), 401

    room = generate_code()
    # Guardamos quién es el host (anfitrión) oficial de la sala
    rooms[room] = {
        "name": room_name, 
        "host": username,
        "members": 0, 
        "messages": [], 
        "files": []
    }

    session["room"] = room
    session["username"] = username

    return jsonify({
        "message": "Sala creada.", 
        "room": room, 
        "roomName": rooms[room]["name"],
        "is_host": True,
        "host": username
    })

# Ruta para obtener los archivos de la sala
@app.get("/room/files/<room_code>")
def show_files(room_code):
    if room_code not in rooms:
        return jsonify({"error": "Sala no encontrada."}), 404

    return jsonify({
        "files": rooms[room_code]["files"]
    })

# Ruta para la descarga de un archivo específico
@app.get("/files/<path:filename>")
def download_file(filename):
    return send_from_directory(
        directory=UPLOAD_FOLDER,
        path=filename,
        as_attachment=True
    )

# Envíos de mensajes en tiempo real vía Socket.io
@socketio.on("message")
def message(data):
    room = data.get("room")
    username = data.get("username")
    
    if not room or room not in rooms:
        return

    files = []
    uploaded = data.get("files", [])

    for file in uploaded:
        filename = file.get("name")
        filedata = file.get("data")

        if filename and filedata:
            safe_name = f"{str(random.randint(0, 57000))}_{secure_filename(filename)}"
            path = os.path.join(UPLOAD_FOLDER, safe_name)

            with open(path, "wb") as f:
                f.write(filedata)

            file_info = {
                "name": filename,
                "url": url_for("download_file", filename=safe_name),
                "type": filename.split('.')[-1].lower()
            }
            files.append(file_info)

    content = {
        "username": username,
        "message": data.get("data", ""),
        "files": files
    }

    rooms[room]["messages"].append(content)
    rooms[room]["files"].extend(files)
    
    socketio.emit("message", content, to=room)

# Evento para unir al usuario a la sala por WebSockets
@socketio.on("join_room")
def on_join(data):
    room = data.get("room")
    username = data.get("username")
    
    if room and username and room in rooms:
        join_room(room)
        
        join_msg = {
            "username": username,
            "message": "entró a la sala.",
            "files": []
        }
        rooms[room]["messages"].append(join_msg)
        socketio.emit("message", join_msg, to=room)

@socketio.on("disconnect")
def disconnect():
    print("Un usuario se desconectó del socket")

if __name__ == "__main__":
    socketio.run(app, debug=True)