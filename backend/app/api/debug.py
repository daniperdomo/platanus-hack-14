from fastapi import APIRouter, File, HTTPException, UploadFile

from app.core.config import settings
from app.services import passport
from app.services.images import decode_image

router = APIRouter()


@router.post("/debug/document")
def debug_document(document: UploadFile = File(...)):
    """Show what Gemini read and what our local MRZ check concludes, without rejecting anything."""
    if not settings.debug_passport:
        raise HTTPException(status_code=404, detail="Not Found")

    document_bytes = document.file.read()
    try:
        image = decode_image(document_bytes)
        reading = passport.ask_gemini(document_bytes)
    except passport.ReaderUnavailableError as error:
        raise HTTPException(status_code=503, detail=str(error))
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error))

    report = {
        "image_size": f"{image.shape[1]}x{image.shape[0]}",
        "gemini": reading.model_dump(),
    }
    try:
        data = passport.validate_reading(reading)
        report["parsed"] = {
            "document_id": data.document_id,
            "birth_date": data.birth_date.isoformat(),
            "nationality": data.nationality,
        }
    except ValueError as error:
        report["parse_error"] = str(error)
    return report
