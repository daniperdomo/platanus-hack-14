import hashlib
import hmac

from app.core.config import settings


def hash_document(document_id: str) -> str:
    return hmac.new(
        settings.hash_pepper.encode(),
        document_id.encode(),
        hashlib.sha256,
    ).hexdigest()
