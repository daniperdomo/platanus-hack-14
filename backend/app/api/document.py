from typing import Optional

from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel

from app.api.ingest import DUPLICATE_DETAIL, NO_HOLDER_PHOTO_DETAIL
from app.core.config import settings
from app.db import database
from app.services import face, hashing, passport
from app.services.images import decode_image

router = APIRouter()


class DocumentCheckResponse(BaseModel):
    ok: bool
    debug: Optional[dict] = None


@router.post(
    "/document/check", response_model=DocumentCheckResponse, response_model_exclude_none=True
)
def check_document(document: UploadFile = File(...)):
    try:
        document_bytes = document.file.read()
        document_image = decode_image(document_bytes)
        document_data = passport.read_passport(document_bytes)
    except passport.ReaderUnavailableError as error:
        raise HTTPException(status_code=503, detail=str(error))
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error))

    if not face.has_face(document_image):
        raise HTTPException(status_code=422, detail=NO_HOLDER_PHOTO_DETAIL)

    if database.document_exists(hashing.hash_document(document_data.document_id)):
        raise HTTPException(status_code=409, detail=DUPLICATE_DETAIL)

    debug = None
    if settings.debug_passport:
        debug = {
            "document_id": document_data.document_id,
            "birth_date": document_data.birth_date.isoformat(),
            "nationality": document_data.nationality,
        }
    return DocumentCheckResponse(ok=True, debug=debug)
