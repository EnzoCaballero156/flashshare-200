from flask import Flask, request, session, jsonify, url_for, send_from_directory
from flask_socketio import join_room, leave_room, send, SocketIO
from flask_cors import CORS
from werkzeug.utils import secure_filename
import random
import os

# para instalar todas las librerias de acá, primero entras a la carpeta server con "cd server"
# de ahí, ejecutas este comando "py -m pip install -r requirements.txt"

app = Flask(__name__) 
app.config["SECRET_KEY"] = "amawoawds"

# se define la carpeta donde se subiran los archivos
UPLOAD_FOLDER = os.path.join(app.root_path, 'files')
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

# CORS para permitir interacción entre el servidor y el frontend
CORS(app, supports_credentials=True)

# se inicializa socket.io y se aumenta el limite de espacio a 10 MB
socketio = SocketIO(app, max_http_buffer_size=10 * 1024 * 1024, cors_allowed_origins="*")

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# diccionario de salas creadas con data de cantidad de miembros, los mensajes enviados y los archivos subidos
rooms = {}

# generar codigo aleatorio de 6 digitos
def generate_code():
    while True:
        code = ""
        for _ in range(6):
            code += str(random.randint(0, 9))

        if code not in rooms:
            break

    return code

# ruta para unirse a una sala
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

    # se devuelve tanto el codigo como el nombre de la sala
    return jsonify({"message": "Te uniste a la sala.", "room": code, "roomName": rooms[code]["name"]})

# ruta para crear la sala
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
    rooms[room] = {"name": room_name, "members": 0, "messages": [], "files": []}

    session["room"] = room
    session["username"] = username

    return jsonify({"message": "Sala creada.", "room": room, "roomName": rooms[room]["name"]})

# ruta para obtener todos los archivos subidos dentro de una sala (para el apartado de archivos dentro del chat)
@app.get("/room/files")
def show_files():
    room = session["room"]
    if room not in rooms:
        return jsonify({"error": "No autorizado."}), 401

    return jsonify({
        "files": rooms[room]["files"]
    })

# ruta para la descarga de un archivo específico (util para los botones de descarga de su archivo respectivo en el frontend)
@app.get("/files/<path:filename>")
def download_file(filename):
    room = session["room"]
    if room not in rooms:
        return jsonify({"error": "No autorizado."}), 401

    return send_from_directory(
        directory=UPLOAD_FOLDER,
        path=filename,
        as_attachment=True
    )

# envíos de mensajes en tiempo real
@socketio.on("message")
def message(data):
    room = session.get("room")
    if room not in rooms:
        return

    username = session.get("username")
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

            files.append({
                "name": filename,
                "url": url_for("download_file", filename=safe_name)
            })

    content = {
        "username": username,
        "message": data.get("data", ""),
        "files": files
    }

    send(content, to=room)
    rooms[room]["messages"].append(content)
    rooms[room]["files"].extend(files)
    print(f"{username} dijo {data["data"]} | Archivos: {len(files)}")

# para la conexión a una sala
@socketio.on("connect")
def connect(auth):
    room = session.get("room")
    username = session.get("username")

    if not room or not username:
        return
    if room not in rooms:
        leave_room(room)
        return

    join_room(room)
    send({"username": username, "message": "entró a la sala."}, to=room)
    rooms[room]["members"] += 1 # se aumenta el numero de miembros dentro de la sala
    print(f"{username} entro a la sala {room}")

# para salirse del chat
@socketio.on("disconnect")
def disconnect():
    room = session.get("room")
    username = session.get("username")
    leave_room(room)

    if room in rooms:
        rooms[room]["members"] -= 1
        if rooms[room]["members"] <= 0:
            del rooms[room] # eliminación completa de la sala
    
    send({"username": username, "message": "se retiró de la sala."}, to=room)
    print(f"{username} se retiró de la sala {room}")

if __name__ == "__main__":
    socketio.run(app, debug=True)