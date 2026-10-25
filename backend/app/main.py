from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.formparsers import MultiPartParser

from app.api import auth, clients, debug, document, ingest, pairings, verify
from app.core.config import settings
from app.db.database import init_db
from app.services import face

# Uploads above this size spool to a temp file on disk; images must stay in RAM.
# Starlette renamed max_file_size to spool_max_size, so both are set.
MAX_UPLOAD_IN_MEMORY = 20 * 1024 * 1024
MultiPartParser.spool_max_size = MAX_UPLOAD_IN_MEMORY
MultiPartParser.max_file_size = MAX_UPLOAD_IN_MEMORY


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    if not settings.gemini_api_key:
        raise RuntimeError("GEMINI_API_KEY no está definida: no se pueden leer pasaportes.")
    face._deepface().build_model(settings.face_model)
    yield


app = FastAPI(title="Oráculo de Retención Cero", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(debug.router)
app.include_router(document.router)
app.include_router(ingest.router)
app.include_router(verify.router)
app.include_router(auth.router)
app.include_router(pairings.router)
app.include_router(clients.router)


@app.get("/health")
def health():
    return {"status": "ok"}
