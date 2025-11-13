from __future__ import annotations

import base64
from dataclasses import dataclass
from typing import Optional

from cryptography.fernet import Fernet, InvalidToken

from .config import get_settings


@dataclass
class Keystore:
    """Encrypts and decrypts sensitive secrets using Fernet symmetric encryption."""

    secret: bytes

    @classmethod
    def from_settings(cls) -> "Keystore":
        settings = get_settings()
        secret = settings.keystore_secret.get_secret_value()
        try:
            decoded = base64.urlsafe_b64decode(secret)
        except Exception as exc:  # pragma: no cover
            raise ValueError("Invalid KEYSTORE_SECRET. Must be urlsafe base64 encoded.") from exc
        return cls(secret=base64.urlsafe_b64encode(decoded))

    @property
    def fernet(self) -> Fernet:
        return Fernet(self.secret)

    def encrypt(self, value: str) -> bytes:
        return self.fernet.encrypt(value.encode("utf-8"))

    def decrypt(self, token: bytes) -> Optional[str]:
        try:
            return self.fernet.decrypt(token).decode("utf-8")
        except InvalidToken:
            return None


_keystore: Optional[Keystore] = None


def get_keystore() -> Keystore:
    global _keystore
    if _keystore is None:
        _keystore = Keystore.from_settings()
    return _keystore
