import os
import uuid
from typing import Tuple
from fastapi import UploadFile
from app.config import settings
from app.services.crypto_service import crypto_service

class StorageService:
    def __init__(self):
        os.makedirs(settings.ORIGINAL_SCANS_DIR, exist_ok=True)

    def save_upload(self, upload_file: UploadFile) -> Tuple[str, str, int]:
        """
        Saves uploaded file immutably with AES-256 encryption at rest.
        Returns: (storage_path, public_url, file_size_bytes)
        """
        ext = os.path.splitext(upload_file.filename)[1].lower()
        if not ext:
            ext = ".png"
        
        unique_name = f"{uuid.uuid4()}{ext}"
        storage_path = os.path.join(settings.ORIGINAL_SCANS_DIR, unique_name)
        
        raw_bytes = upload_file.file.read()
        file_size = len(raw_bytes)

        # Encrypt scan bytes at rest using AES-256 / Fernet
        encrypted_bytes = crypto_service.encrypt_bytes(raw_bytes)
        with open(storage_path, "wb") as buffer:
            buffer.write(encrypted_bytes)
            
        public_url = f"/api/v1/documents/scan-stream/{unique_name}"
        
        return storage_path, public_url, file_size

    def get_file_bytes(self, storage_path: str) -> bytes:
        """Reads and transparently decrypts file bytes from disk"""
        if not os.path.exists(storage_path):
            raise FileNotFoundError(f"File not found: {storage_path}")
        with open(storage_path, "rb") as f:
            raw = f.read()
        return crypto_service.decrypt_bytes(raw)

storage_service = StorageService()
