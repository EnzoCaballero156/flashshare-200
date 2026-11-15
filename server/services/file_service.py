from entities.message import Message
from entities.file import File
from repositories.message.imessage_repository import IMessageRepository
from repositories.file.ifile_repository import IFileRepository
from repositories.room.iroom_repository import IRoomRepository

class FileService:
    def __init__(self, message_repository: IMessageRepository, room_repository: IRoomRepository, file_repository: IFileRepository, cloudinary_service):
        self.message_repository = message_repository
        self.room_repository = room_repository
        self.file_repository = file_repository

        self.cloudinary_service = cloudinary_service

    def format_files(self, files_data):
        return [{
            "name": file.name,
            "url": file.url,
            "type": file.type,
            "size": file.size
        } for file in files_data]


    def add_files(self, room_code, uploaded):
        room = self.room_repository.find_by_code(room_code)
        
        if room is None:
            raise Exception("La sala no existe.")
        
        files_data = []

        for file in uploaded:
            filename = file.get("name")
            filedata = file.get("data")

            if filename and filedata:
                upload = self.cloudinary_service.upload_file(room, filename, filedata) 
                url = self.cloudinary_service.get_download_url(upload)
    
                new_file = File(name=filename, url=url, type=filename.split('.')[-1].lower(), size=upload.get("bytes"), room=room)
                files_data.append(new_file)

        return files_data