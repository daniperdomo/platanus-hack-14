import hashlib
import hmac

from app.core.config import settings


<<<<<<< Updated upstream
def normalize_rut(rut: str) -> str:
    return re.sub(r"[^0-9K]", "", rut.upper())


def hash_document(rut: str) -> str:
=======
def hash_document(document_id: str) -> str:
>>>>>>> Stashed changes
    return hmac.new(
        settings.hash_pepper.encode(),
        normalize_rut(rut).encode(),
        hashlib.sha256,
    ).hexdigest()
