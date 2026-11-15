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
            resource_type="auto"
        )   

    def get_download_url(self, upload):
        res_type = upload.get("resource_type")
            
        if res_type == "raw":
            url = upload.get("secure_url")
        else:
            url, _ = cloudinary.utils.cloudinary_url(
                upload.get("public_id"),
                resource_type=res_type,
                flags="attachment",
                secure=True
            )

        return upload.get("secure_url")

    def clear_files(self, room):
        for tipo in ["image", "video", "raw"]:
            cloudinary.api.delete_resources_by_prefix(f"files/{room}R_", resource_type=tipo)