from entities.message import Message
from entities.file import File
from repositories.message.imessage_repository import IMessageRepository
from repositories.file.ifile_repository import IFileRepository
from repositories.room.iroom_repository import IRoomRepository
from werkzeug.utils import secure_filename
import cloudinary.utils
import cloudinary.uploader
import random

class MessageService:
    def __init__(self, message_repository: IMessageRepository, room_repository: IRoomRepository, file_repository: IFileRepository):
        self.message_repository = message_repository
        self.room_repository = room_repository
        self.file_repository = file_repository
    
    def find_all_by_room_id(self, room_id):
        return self.message_repository.find_all_by_room_id(room_id)

    def send(self, username, room_code, content, uploaded):
        if not username or not room_code or (not content and not uploaded):
            raise Exception("Datos incompletos.")

        print("datos completos jajejwiejiawje", username, room_code, content, uploaded)

        room = self.room_repository.find_by_code(room_code)

        if room is None:
            raise Exception("La sala no existe.")

        print("la sala si existe calajo")

        files = []
        files_data = []

        print("se generaron las listas?")

        for file in uploaded:
            print("pasamos al for")
            filename = file.get("name")
            filedata = file.get("data")

            print(filename)
    
            if filename and filedata:
                safe_name = f"{room.code}R_{str(random.randint(0, 57000))}_{secure_filename(filename)}"
    
                upload = cloudinary.uploader.upload(
                    filedata,
                    public_id=safe_name,
                    folder="files",
                    resource_type="auto"
                )   
    
                res_type = upload.get("resource_type")

                print(res_type)
    
                if res_type == "raw":
                    url = upload.get("secure_url")
                else:
                    url, _ = cloudinary.utils.cloudinary_url(
                        upload.get("public_id"),
                        resource_type=res_type,
                        flags="attachment",
                        secure=True
                    )
    
                file_info = {
                    "name": filename,
                    "url": url,
                    "type": filename.split('.')[-1].lower(),
                    "size": upload.get("bytes")
                }

                print(file_info)
    
                files.append(file_info)
                new_file = File(name=file_info["name"], url=file_info["url"], type=file_info["type"], size=file_info["size"], room=room)
                files_data.append(new_file)

        new_message = Message(user=username, content=content, room=room)
        if files_data: new_message.files = files_data

        try:
            self.message_repository.save(new_message)
        except Exception as e:
            print("error:", repr(e))
            raise e

        print("salio muchchcos??????")
        print(files)

        return files