import asyncio
import logging
from contextlib import asynccontextmanager

from apscheduler.schedulers.background import BackgroundScheduler
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.datastructures import Headers
from starlette.formparsers import MultiPartParser
from starlette.responses import JSONResponse
from starlette.types import ASGIApp, Receive, Scope, Send

from app.api import auth, clients, debug, document, ingest, pairings, verify
from app.api.routers import trust, trust_async
from app.core.config import settings
from app.db.database import init_db
from app.services import face

logger = logging.getLogger(__name__)
scheduler = BackgroundScheduler()


def _configure_app_logging() -> None:
    uvicorn_logger = logging.getLogger("uvicorn.error")
    app_logger = logging.getLogger("app")
    app_logger.handlers = list(uvicorn_logger.handlers)
    app_logger.setLevel(logging.INFO)
    app_logger.propagate = False

# Requests above this size are refused before the multipart parser runs, and parts up to this
# size stay in RAM: Starlette spools larger parts to a temp file on disk.
# Starlette renamed max_file_size to spool_max_size, so both are set.
MAX_UPLOAD_BYTES = 10 * 1024 * 1024
MultiPartParser.spool_max_size = MAX_UPLOAD_BYTES
MultiPartParser.max_file_size = MAX_UPLOAD_BYTES

UPLOAD_PATHS = {"/ingest", "/document/check", "/debug/document"}
UPLOAD_TOO_LARGE_DETAIL = "La imagen supera los 10 MB o la petición no indica su tamaño."


class UploadLimitMiddleware:
    """Must run before FastAPI parses the form: by then the body is already spooled."""

    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] == "http" and scope["method"] == "POST" and scope["path"] in UPLOAD_PATHS:
            length = Headers(scope=scope).get("content-length", "")
            if not length.isdigit() or int(length) > MAX_UPLOAD_BYTES:
                response = JSONResponse({"detail": UPLOAD_TOO_LARGE_DETAIL}, status_code=413)
                await response(scope, receive, send)
                return
        await self.app(scope, receive, send)


@asynccontextmanager
async def lifespan(_: FastAPI):
    _configure_app_logging()
    settings.require_secrets()
    init_db()
    if not settings.gemini_api_key:
        raise RuntimeError("GEMINI_API_KEY no está definida: no se pueden leer pasaportes.")
    face._deepface().build_model(settings.face_model)

    loop = asyncio.get_running_loop()
    scheduler.add_job(
        trust_async.enqueue_continuous_audit,
        "interval",
        hours=1,  # producción: days=7
        args=[loop],
        id="trust_continuous_audit",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("Scheduler de auditoría Trust iniciado (cada 1 hora; objetivo de producción: 7 días).")
    try:
        yield
    finally:
        scheduler.shutdown(wait=False)


app = FastAPI(title="Oráculo de Retención Cero", lifespan=lifespan)

# Added before CORS so a 413 still carries the CORS headers the browser needs to read it.
app.add_middleware(UploadLimitMiddleware)
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
app.include_router(trust.router)
app.include_router(trust_async.router)


@app.get("/health")
def health():
    return {"status": "ok"}
