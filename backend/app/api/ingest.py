import logging
from datetime import date

import psycopg
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel

from app.core.config import settings
from app.core.security import issue_credential, parse_device_jwk
from app.db import database
from app.services import face, hashing, passport
from app.services.images import decode_image

logger = logging.getLogger(__name__)
router = APIRouter()

DUPLICATE_DETAIL = "Ya estás registrado: esta persona ya tiene una credencial."
NO_FACE_DETAIL = "No se detectó ningún rostro en la selfie. Asegúrate de tener buena iluminación."
NO_HOLDER_PHOTO_DETAIL = (
    "No encontramos la foto del titular en el pasaporte. Fotografía la página de datos completa."
)


class IngestResponse(BaseModel):
    token: str
    claims: dict
    # Returned once so the device can encrypt it. The oráculo does not store it.
    profile: dict


def _age(birth_date: date) -> int:
    today = date.today()
    return today.year - birth_date.year - (
        (today.month, today.day) < (birth_date.month, birth_date.day)
    )


@router.post("/ingest", response_model=IngestResponse)
def ingest(
    selfie: UploadFile = File(...),
    document: UploadFile = File(...),
    device_public_jwk: str = Form(...),
):
    try:
        device_key = parse_device_jwk(device_public_jwk)
        selfie_image = decode_image(selfie.file.read())
        document_bytes = document.file.read()
        document_image = decode_image(document_bytes)
        document_data = passport.read_passport(document_bytes)
    except passport.ReaderUnavailableError as error:
        raise HTTPException(status_code=503, detail=str(error))
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error))

    # DeepFace raises ValueError ("Face could not be detected", "Exception while
    # processing img1_path") whenever it cannot find a face in either image.
    try:
        if not face.faces_match(selfie_image, document_image):
            raise HTTPException(status_code=422, detail="La selfie no coincide con la foto del pasaporte.")
        embedding = face.embed_face(selfie_image)
    except ValueError as error:
        selfie_ok = face.has_face(selfie_image)
        logger.warning("Sin rostro al verificar (selfie_ok=%s): %s", selfie_ok, error)
        detail = NO_HOLDER_PHOTO_DETAIL if selfie_ok else NO_FACE_DETAIL
        raise HTTPException(status_code=422, detail=detail)

    document_hash = hashing.hash_document(document_data.document_id)
    if database.document_exists(document_hash) or database.face_exists(embedding):
        raise HTTPException(status_code=409, detail=DUPLICATE_DETAIL)

    try:
        credential_id = database.save_identity(document_hash, embedding)
    except psycopg.errors.UniqueViolation:
        raise HTTPException(status_code=409, detail=DUPLICATE_DETAIL)

    claims = {
        "persona_real_unica": True,
        "mayor_de_edad": _age(document_data.birth_date) >= settings.adult_age,
        "nacionalidad": document_data.nationality,
    }
    profile = {
        "nombre": document_data.holder_name,
        "documento": document_data.document_id,
        "fecha_nacimiento": document_data.birth_date.isoformat(),
        "nacionalidad": document_data.nationality,
    }
    token = issue_credential(claims, device_key, credential_id)
    return IngestResponse(token=token, claims=claims, profile=profile)
