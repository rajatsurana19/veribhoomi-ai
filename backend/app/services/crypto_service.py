import os
import base64
import hashlib
from typing import Optional
from cryptography.fernet import Fernet
from app.config import settings

class CryptoService:
    """
    Cryptographic Service for VeriBhoomi AI:
    Enforces AES-256/Fernet encryption at rest for:
    - Immutable scan files stored on disk
    - Sensitive citizen identity and cadastral attributes in database
    """

    def __init__(self, secret_key: Optional[str] = None):
        key_source = secret_key or settings.ENCRYPTION_KEY or settings.SECRET_KEY
        # Derive a valid URL-safe 32-byte Fernet key from the secret
        key_hash = hashlib.sha256(key_source.encode("utf-8")).digest()
        self._fernet_key = base64.urlsafe_b64encode(key_hash)
        self._cipher = Fernet(self._fernet_key)

    def encrypt_bytes(self, raw_bytes: bytes) -> bytes:
        """Encrypt binary data (e.g. document scans)"""
        if not raw_bytes:
            return raw_bytes
        return self._cipher.encrypt(raw_bytes)

    def decrypt_bytes(self, encrypted_bytes: bytes) -> bytes:
        """Decrypt binary data. If unencrypted, returns original bytes safely."""
        if not encrypted_bytes:
            return encrypted_bytes
        try:
            return self._cipher.decrypt(encrypted_bytes)
        except Exception:
            # If already raw/legacy unencrypted bytes, return directly
            return encrypted_bytes

    def encrypt_text(self, text: Optional[str]) -> Optional[str]:
        """Encrypt string fields"""
        if not text:
            return text
        enc = self._cipher.encrypt(text.encode("utf-8"))
        return enc.decode("utf-8")

    def decrypt_text(self, cipher_text: Optional[str]) -> Optional[str]:
        """Decrypt string fields. If plaintext, returns as-is."""
        if not cipher_text:
            return cipher_text
        try:
            dec = self._cipher.decrypt(cipher_text.encode("utf-8"))
            return dec.decode("utf-8")
        except Exception:
            return cipher_text

# Singleton instance
crypto_service = CryptoService()
