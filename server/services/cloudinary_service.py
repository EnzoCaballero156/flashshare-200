import cloudinary.utils
import cloudinary.uploader
import cloudinary.api

from werkzeug.utils import secure_filename
import random

class CloudinaryService:
    def upload_file(self, room, filename, filedata):
        safe_name = f"{room.code}R_{str(random.randint(0, 57000))}_{secure_filename(filename)}"
        return cloudinary.uploader.upload(
            filedata,
            public_id=safe_name,
            folder="files",
            resource_type="auto",
            filename_override=filename
        )   

    def get_download_url(self, upload):
        return upload.get("secure_url").replace("/upload/", "/upload/fl_attachment/", 1)

    def clear_files(self, room):
        for tipo in ["image", "video", "raw"]:
            cloudinary.api.delete_resources_by_prefix(f"files/{room}R_", resource_type=tipo)