import hashlib
import hmac
import re

from app.core.config import settings


def normalize_rut(rut: str) -> str:
    return re.sub(r"[^0-9K]", "", rut.upper())


def hash_document(document_id: str) -> str:
    return hmac.new(
        settings.hash_pepper.encode(),
        document_id.encode(),
        hashlib.sha256,
    ).hexdigest()
