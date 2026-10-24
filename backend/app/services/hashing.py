import hashlib
import hmac
import re

from app.core.config import settings


def normalize_rut(rut: str) -> str:
    return re.sub(r"[^0-9K]", "", rut.upper())


def hash_document(rut: str) -> str:
    return hmac.new(
        settings.hash_pepper.encode(),
        normalize_rut(rut).encode(),
        hashlib.sha256,
    ).hexdigest()
