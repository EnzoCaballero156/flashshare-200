from .ifile_repository import IFileRepository
from entities.file import File
from utils.extensions import db

class FileRepository(IFileRepository):
    def find_all(self):
        return File.query.all()

    def find_by_id(self, id):
        return File.query.filter_by(id=id).first()

    def find_all_by_room_id(self, room_id):
        return File.query.filter_by(room_id=room_id).all()

    def save(self, entity):
        db.session.add(entity)
        db.session.commit()
        return entity

    def delete(self, entity):
        db.session.delete(entity)
        db.session.commit()
        return True