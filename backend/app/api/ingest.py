import json
from datetime import date

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel

from app.core.config import settings
from app.core.security import issue_credential
from app.db import database
from app.services import face, hashing, passport
from app.services.images import decode_image

router = APIRouter()

<<<<<<< Updated upstream
=======
DUPLICATE_DETAIL = "Ya estás registrado: esta persona ya tiene una credencial."
NO_FACE_DETAIL = "No se detectó ningún rostro en la selfie. Asegúrate de tener buena iluminación."

>>>>>>> Stashed changes

class IngestResponse(BaseModel):
    token: str
    claims: dict


def _age(birth_date: date) -> int:
    today = date.today()
    return today.year - birth_date.year - (
        (today.month, today.day) < (birth_date.month, birth_date.day)
    )


@router.post("/ingest", response_model=IngestResponse)
async def ingest(
    selfie: UploadFile = File(...),
    document: UploadFile = File(...),
    device_public_jwk: str = Form(...),
):
    try:
        device_key = json.loads(device_public_jwk)
<<<<<<< Updated upstream
        selfie_image = decode_image(await selfie.read())
        document_image = decode_image(await document.read())
        document_data = ocr.read_document(document_image)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error))

    if not face.faces_match(selfie_image, document_image):
        raise HTTPException(status_code=422, detail="La selfie no coincide con el carnet.")

    document_hash = hashing.hash_document(document_data.rut)
    embedding = face.embed_face(selfie_image)

=======
        selfie_image = decode_image(selfie.file.read())
        document_bytes = document.file.read()
        document_image = decode_image(document_bytes)
        document_data = passport.read_passport(document_bytes)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error))

    # DeepFace raises ValueError ("Face could not be detected", "Exception while
    # processing img1_path") whenever it cannot find a face in either image.
    try:
        if not face.faces_match(selfie_image, document_image):
            raise HTTPException(status_code=422, detail="La selfie no coincide con la foto del pasaporte.")
        embedding = face.embed_face(selfie_image)
    except ValueError:
        raise HTTPException(status_code=422, detail=NO_FACE_DETAIL)

    document_hash = hashing.hash_document(document_data.document_id)
>>>>>>> Stashed changes
    if database.document_exists(document_hash) or database.face_exists(embedding):
        raise HTTPException(status_code=409, detail="Esta persona ya tiene una credencial.")

    database.save_identity(document_hash, embedding)

    claims = {
        "persona_real_unica": True,
        "mayor_de_edad": _age(document_data.birth_date) >= settings.adult_age,
        "nacionalidad": document_data.nationality,
    }
    return IngestResponse(token=issue_credential(claims, device_key), claims=claims)
