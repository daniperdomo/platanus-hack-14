import hmac
import secrets
import uuid
from typing import Any, Dict, List, Optional
from urllib.parse import urlsplit

from fastapi import APIRouter, BackgroundTasks, Header, HTTPException
from pydantic import BaseModel, Field

from app.api.auth import (
    EXPIRED_DETAIL,
    ALREADY_DELIVERED_DETAIL,
    ORACLE_FIELDS,
    PERSONAL_FIELDS,
    PRESENTATION_TTL,
    REQUEST_TTL_SECONDS,
    FieldIn,
    _load_request,
)
from app.core.security import issue_presentation, public_jwk
from app.db import database
from app.services import hashing, push

router = APIRouter()

SIGN_IN_KIND = "sign_in"
DEFAULT_SCOPES = ["persona_real_unica"]
SCOPE_PURPOSE = {
    "persona_real_unica": "Confirmar que eres una persona real con una sola cuenta.",
    "mayor_de_edad": "Confirmar que eres mayor de edad, sin conocer tu fecha de nacimiento.",
    "nacionalidad": "Conocer tu país de nacionalidad.",
}
CLIENT_NOT_FOUND = "La aplicación no está registrada en ZeroID."
ORIGIN_DETAIL = "Este sitio no está autorizado para esta aplicación."
SECRET_DETAIL = "Client secret inválido."
USER_DETAIL = "No encontramos ese usuario de ZeroID."
LOCAL_HOSTS = {"localhost", "127.0.0.1"}


class ClientIn(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    origins: List[str] = Field(min_length=1, max_length=10)
    redirect_uri: str = Field(default="", max_length=300)


class ClientCreated(BaseModel):
    client_id: str
    client_secret: str
    name: str
    origins: List[str]


class ClientPublic(BaseModel):
    client_id: str
    name: str
    origins: List[str]


class SignInIn(BaseModel):
    client_id: str
    origin: str
    username: Optional[str] = None
    scopes: List[str] = Field(default_factory=lambda: list(DEFAULT_SCOPES))
    fields: List[FieldIn] = Field(default_factory=list, max_length=len(PERSONAL_FIELDS))


class SignInOut(BaseModel):
    request_id: str
    expires_in: int
    approve_uri: str
    notified: bool


class ExchangeIn(BaseModel):
    request_id: str


class ExchangeOut(BaseModel):
    status: str
    subject: Optional[str] = None
    claims: Optional[Dict[str, Any]] = None
    token: Optional[str] = None


def normalize_origin(value: str) -> str:
    parts = urlsplit(value.strip())
    host = (parts.hostname or "").lower()
    secure = parts.scheme == "https" or (parts.scheme == "http" and host in LOCAL_HOSTS)
    if not host or not secure:
        raise HTTPException(status_code=422, detail=f"Origen inválido: {value}. Usa https://")
    port = f":{parts.port}" if parts.port else ""
    return f"{parts.scheme}://{host}{port}"


def pairwise_subject(client_id: str, credential_id: str) -> str:
    """Stable per user and site, but two sites cannot link the same person."""
    return hashing.hash_document(f"pairwise:{client_id}:{credential_id}")


def personal_fields(items: List[FieldIn]) -> List[dict]:
    """Personal data must say why it is needed, so the phone can show it before sharing."""
    fields = []
    for item in items:
        name = item.field.strip()
        if name not in PERSONAL_FIELDS:
            raise HTTPException(status_code=400, detail=f"Dato personal desconocido: {name}.")
        if not item.purpose.strip():
            raise HTTPException(status_code=422, detail=f"Explica para qué necesitas {name}.")
        if any(existing["field"] == name for existing in fields):
            continue
        fields.append(
            {
                "field": name,
                "purpose": item.purpose.strip(),
                "retention": item.retention.strip() or "No se indicó.",
                "required": item.required,
            }
        )
    return fields


def _client(client_id: str) -> dict:
    client = database.get_client(client_id)
    if client is None:
        raise HTTPException(status_code=404, detail=CLIENT_NOT_FOUND)
    return client


@router.post("/clients", response_model=ClientCreated)
def register_client(body: ClientIn):
    origins = sorted({normalize_origin(origin) for origin in body.origins})
    client_id = f"zid_live_{secrets.token_hex(8)}"
    client_secret = f"zsk_live_{secrets.token_urlsafe(32)}"
    database.create_client(
        client_id,
        hashing.hash_document(client_secret),
        body.name.strip(),
        origins,
        body.redirect_uri.strip(),
    )
    return ClientCreated(
        client_id=client_id, client_secret=client_secret, name=body.name.strip(), origins=origins
    )


@router.get("/clients/{client_id}", response_model=ClientPublic)
def read_client(client_id: str):
    client = _client(client_id)
    return ClientPublic(client_id=client["client_id"], name=client["name"], origins=client["origins"])


@router.post("/auth/sign-in", response_model=SignInOut)
def sign_in(body: SignInIn, background: BackgroundTasks):
    client = _client(body.client_id)
    origin = normalize_origin(body.origin)
    if origin not in client["origins"]:
        raise HTTPException(status_code=403, detail=ORIGIN_DETAIL)

    scopes = list(dict.fromkeys(body.scopes or DEFAULT_SCOPES))
    unknown = [scope for scope in scopes if scope not in ORACLE_FIELDS]
    if unknown:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Los scopes solo admiten pruebas del oráculo, no {', '.join(unknown)}. "
                "Pide los datos personales en fields."
            ),
        )
    personal = personal_fields(body.fields)

    owner = None
    if body.username and body.username.strip():
        account = database.get_account_by_username(body.username.strip().lower())
        if account is None:
            raise HTTPException(status_code=404, detail=USER_DETAIL)
        owner = account["credential_id"]

    fields = [
        {"field": scope, "purpose": SCOPE_PURPOSE[scope], "retention": "No se guarda", "required": True}
        for scope in scopes
    ] + personal
    request_id = database.create_auth_request(
        client["name"],
        [item["field"] for item in fields],
        secrets.token_urlsafe(32),
        REQUEST_TTL_SECONDS,
        client_domain=urlsplit(origin).hostname or "",
        fields=fields,
        kind=SIGN_IN_KIND,
        credential_id=owner,
        client_id=client["client_id"],
    )
    if owner:
        background.add_task(
            push.notify_credential,
            owner,
            f"Iniciar sesión en {client['name']}",
            "Confirma que eres tú y revisa los datos que pide."
            if personal
            else "Confirma que eres tú. No compartirás datos personales.",
            {"request_id": request_id},
        )
    return SignInOut(
        request_id=request_id,
        expires_in=REQUEST_TTL_SECONDS,
        approve_uri=f"zeroid://approve?request={request_id}",
        notified=owner is not None,
    )


@router.post("/clients/{client_id}/exchange", response_model=ExchangeOut)
def exchange(client_id: str, body: ExchangeIn, authorization: Optional[str] = Header(default=None)):
    client = _client(client_id)
    secret = (authorization or "").removeprefix("Bearer ").strip()
    if not secret or not hmac.compare_digest(hashing.hash_document(secret), client["secret_hash"]):
        raise HTTPException(status_code=401, detail=SECRET_DETAIL)

    request = _load_request(body.request_id)
    if request.get("client_id") != client_id:
        raise HTTPException(status_code=404, detail="Esta solicitud no es de tu aplicación.")
    if request["consumed"] and not request["approved"]:
        return ExchangeOut(status="rejected")
    if request["expired"] and not request["approved"]:
        raise HTTPException(status_code=410, detail=EXPIRED_DETAIL)
    if request["consumed"]:
        raise HTTPException(status_code=410, detail=ALREADY_DELIVERED_DETAIL)
    if not request["approved"]:
        return ExchangeOut(status="pending")

    delivered = database.consume_auth_request(uuid.UUID(body.request_id))
    if delivered is None or not delivered.get("credential_id"):
        raise HTTPException(status_code=410, detail=ALREADY_DELIVERED_DETAIL)
    subject = pairwise_subject(client_id, delivered["credential_id"])
    claims = delivered["claims"] or {}
    token = issue_presentation(claims, client_id, PRESENTATION_TTL, subject=subject)
    return ExchangeOut(status="delivered", subject=subject, claims=claims, token=token)


@router.get("/.well-known/jwks.json")
def jwks():
    return {"keys": [public_jwk()]}
