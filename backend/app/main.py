from contextlib import asynccontextmanager

import pytesseract
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import ingest, verify
from app.core.config import settings
from app.db.database import init_db
<<<<<<< Updated upstream
=======
from app.services import face

# Uploads above this size spool to a temp file on disk; images must stay in RAM.
# Starlette renamed max_file_size to spool_max_size, so both are set.
MAX_UPLOAD_IN_MEMORY = 20 * 1024 * 1024
MultiPartParser.spool_max_size = MAX_UPLOAD_IN_MEMORY
MultiPartParser.max_file_size = MAX_UPLOAD_IN_MEMORY
>>>>>>> Stashed changes


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
<<<<<<< Updated upstream
=======
    # Fail at boot, not on the first /ingest, if the image is missing the tesseract binary.
    pytesseract.get_tesseract_version()
    face._deepface().build_model(settings.face_model)
>>>>>>> Stashed changes
    yield


app = FastAPI(title="Oráculo de Retención Cero", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ingest.router)
app.include_router(verify.router)


@app.get("/health")
def health():
    return {"status": "ok"}
