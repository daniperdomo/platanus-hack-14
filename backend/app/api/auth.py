import re
import secrets
import uuid
from datetime import timedelta
from typing import Any, Dict, List, Optional

import jwt
import psycopg
from fastapi import APIRouter, BackgroundTasks, Header, HTTPException
from pydantic import BaseModel, Field

from app.core.passwords import hash_password, verify_password
from app.core.security import (
    decode_credential,
    issue_presentation,
    issue_session,
    verify_device_signature,
)
from app.db import database
from app.services import hashing, push

router = APIRouter(prefix="/auth")

ORACLE_FIELDS = {"persona_real_unica", "mayor_de_edad", "nacionalidad"}
PERSONAL_FIELDS = {"nombre", "email", "telefono", "fecha_nacimiento", "documento", "direccion"}
KNOWN_FIELDS = ORACLE_FIELDS | PERSONAL_FIELDS
REQUEST_TTL_SECONDS = 300
PRESENTATION_TTL = timedelta(minutes=10)
USERNAME_PATTERN = re.compile(r"^[a-z0-9][a-z0-9._-]{2,31}$")
EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
REGISTER_PREFIX = "zeroid-register:"

INVALID_DETAIL = "Credencial inválida, expirada o revocada."
NOT_FOUND_DETAIL = "Solicitud de autorización no encontrada."
EXPIRED_DETAIL = "La solicitud expiró. Pide una nueva."
ALREADY_APPROVED_DETAIL = "Esta solicitud ya fue autorizada."
ALREADY_DELIVERED_DETAIL = "Este token ya fue entregado."
PENDING_DETAIL = "La solicitud sigue pendiente."
POSSESSION_DETAIL = "No pudimos comprobar que la credencial está en este dispositivo."
OTHER_ACCOUNT_DETAIL = "Esta solicitud pertenece a otra cuenta."
LOGIN_DETAIL = "Usuario o contraseña incorrectos."


class FieldIn(BaseModel):
    field: str = Field(min_length=1, max_length=40)
    purpose: str = Field(default="", max_length=240)
    retention: str = Field(default="", max_length=240)
    required: bool = True


class AuthRequestIn(BaseModel):
    client_name: str = Field(min_length=1, max_length=80)
    client_domain: str = Field(default="", max_length=120)
    rules: List[str] = Field(default_factory=list)
    fields: List[FieldIn] = Field(default_factory=list)


class AuthRequestOut(BaseModel):
    request_id: str
    challenge: str
    expires_in: int


class ApproveIn(BaseModel):
    token: str
    signature: str
    disclosures: Dict[str, Any] = Field(default_factory=dict)


class ApproveOut(BaseModel):
    status: str


class TokenOut(BaseModel):
    status: str
    token: Optional[str] = None
    claims: Optional[Dict[str, Any]] = None


class ConnectionOut(BaseModel):
    id: str
    client_name: str
    client_domain: str = ""
    rules: List[str]
    created_at: str


class ConnectionsOut(BaseModel):
    connections: List[ConnectionOut]


class FieldOut(BaseModel):
    field: str
    purpose: str
    retention: str
    required: bool


class RequestView(BaseModel):
    request_id: str
    client_name: str
    client_domain: str
    kind: str
    challenge: str
    fields: List[FieldOut]
    status: str
    expires_in: int


class InboxOut(BaseModel):
    requests: List[RequestView]


class AccountIn(BaseModel):
    token: str
    signature: str
    username: str
    password: str = Field(min_length=8, max_length=128)
    email: Optional[str] = None
    vault_ciphertext: str = Field(min_length=1, max_length=20000)
    wrapped_key: str = Field(min_length=1, max_length=500)
    wrap_salt: str = Field(min_length=1, max_length=200)
    wrap_iterations: int = Field(ge=100_000, le=1_000_000)


class AccountCreated(BaseModel):
    username: str
    session_token: str


class LoginIn(BaseModel):
    username: str
    password: str


class SessionOut(BaseModel):
    status: str
    session_token: Optional[str] = None
    username: Optional[str] = None
    vault_ciphertext: Optional[str] = None
    wrapped_key: Optional[str] = None
    wrap_salt: Optional[str] = None
    wrap_iterations: Optional[int] = None


class AccountOut(BaseModel):
    username: str
    paired: bool


class PushTokenIn(BaseModel):
    token: str = Field(min_length=10, max_length=200)


def _fields_of(request: dict) -> List[dict]:
    if request.get("fields"):
        return request["fields"]
    return [
        {"field": rule, "purpose": "", "retention": "", "required": True}
        for rule in request.get("rules", [])
    ]


def _field_out(item: dict) -> FieldOut:
    return FieldOut(
        field=item["field"],
        purpose=item.get("purpose") or "",
        retention=item.get("retention") or "",
        required=bool(item.get("required", True)),
    )


def _request_status(request: dict) -> str:
    if request["consumed"]:
        return "consumed"
    if request["expired"] and not request["approved"]:
        return "expired"
    if request["approved"]:
        return "approved"
    return "pending"


def _view(request_id: str, request: dict) -> RequestView:
    return RequestView(
        request_id=request_id,
        client_name=request["client_name"],
        client_domain=request.get("client_domain") or "",
        kind=request.get("kind") or "third_party",
        challenge=request["challenge"],
        fields=[_field_out(item) for item in _fields_of(request)],
        status=_request_status(request),
        expires_in=request.get("expires_in") or 0,
    )


def _normalize_fields(body: AuthRequestIn) -> List[dict]:
    source = body.fields or [FieldIn(field=rule) for rule in body.rules]
    seen = set()
    fields = []
    unknown = []
    for item in source:
        name = item.field.strip()
        if name in seen:
            continue
        seen.add(name)
        if name not in KNOWN_FIELDS:
            unknown.append(name)
            continue
        fields.append(
            {
                "field": name,
                "purpose": item.purpose.strip(),
                "retention": item.retention.strip(),
                "required": item.required,
            }
        )
    if unknown:
        raise HTTPException(status_code=400, detail=f"Reglas desconocidas: {', '.join(unknown)}")
    if not fields:
        raise HTTPException(status_code=400, detail="Tienes que pedir al menos un dato.")
    return fields


def _load_request(request_id: str) -> dict:
    try:
        parsed = uuid.UUID(request_id)
    except ValueError:
        raise HTTPException(status_code=404, detail=NOT_FOUND_DETAIL)
    request = database.get_auth_request(parsed)
    if request is None:
        raise HTTPException(status_code=404, detail=NOT_FOUND_DETAIL)
    return request


def _credential_payload(token: str, *, allow_session: bool = False) -> dict:
    try:
        payload = decode_credential(token)
        kind = payload.get("typ")
        if kind == "presentation" or (kind == "session" and not allow_session):
            raise ValueError
        uuid.UUID(payload["sub"])
    except (jwt.InvalidTokenError, ValueError, KeyError):
        raise HTTPException(status_code=401, detail=INVALID_DETAIL)
    if not database.credential_exists(uuid.UUID(payload["sub"])):
        raise HTTPException(status_code=401, detail=INVALID_DETAIL)
    return payload


def _bearer(authorization: Optional[str], *, allow_session: bool = False) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail=INVALID_DETAIL)
    return _credential_payload(authorization.removeprefix("Bearer ").strip(), allow_session=allow_session)


def _clean_text(value: Any) -> Optional[str]:
    if not isinstance(value, str):
        return None
    text = value.strip()
    if not text:
        return None
    return text[:200]


def _disclosed(request: dict, payload: dict, disclosures: Dict[str, Any]) -> Dict[str, Any]:
    claims = payload.get("claims") or {}
    disclosed: Dict[str, Any] = {}
    missing = []
    for item in _fields_of(request):
        name = item["field"]
        required = bool(item.get("required", True))
        if name in ORACLE_FIELDS:
            if name not in claims:
                missing.append(name)
                continue
            if required or name in disclosures:
                disclosed[name] = claims[name]
            continue
        value = _clean_text(disclosures.get(name))
        if required and value is None:
            missing.append(name)
        elif value is not None:
            disclosed[name] = value
    if missing:
        raise HTTPException(
            status_code=400, detail=f"Faltan datos obligatorios: {', '.join(missing)}"
        )
    return disclosed


def _username(value: str) -> str:
    username = value.strip().lower()
    if not USERNAME_PATTERN.match(username):
        raise HTTPException(
            status_code=422,
            detail="El usuario debe tener entre 3 y 32 caracteres: letras, números, punto, guion o guion bajo.",
        )
    return username


@router.post("/requests", response_model=AuthRequestOut)
def create_request(body: AuthRequestIn):
    client_name = body.client_name.strip()
    if not client_name:
        raise HTTPException(status_code=422, detail="El nombre de la aplicación no puede estar vacío.")
    fields = _normalize_fields(body)
    rules = [item["field"] for item in fields]
    challenge = secrets.token_urlsafe(32)
    request_id = database.create_auth_request(
        client_name,
        rules,
        challenge,
        REQUEST_TTL_SECONDS,
        client_domain=body.client_domain.strip(),
        fields=fields,
        kind="third_party",
    )
    return AuthRequestOut(
        request_id=request_id, challenge=challenge, expires_in=REQUEST_TTL_SECONDS
    )


@router.get("/requests/{request_id}", response_model=RequestView)
def read_request(request_id: str):
    return _view(request_id, _load_request(request_id))


@router.post("/requests/{request_id}/approve", response_model=ApproveOut)
def approve_request(request_id: str, body: ApproveIn):
    request = _load_request(request_id)
    if request["expired"]:
        raise HTTPException(status_code=410, detail=EXPIRED_DETAIL)
    if request["approved"] or request["consumed"]:
        raise HTTPException(status_code=409, detail=ALREADY_APPROVED_DETAIL)

    payload = _credential_payload(body.token)
    owner = request.get("credential_id")
    if owner and owner != payload["sub"]:
        raise HTTPException(status_code=401, detail=OTHER_ACCOUNT_DETAIL)
    jwk = payload.get("cnf", {}).get("jwk", {})
    if not verify_device_signature(jwk, request["challenge"], body.signature):
        raise HTTPException(status_code=401, detail=POSSESSION_DETAIL)

    kind = request.get("kind") or "third_party"
    disclosed = {} if kind == "login" else _disclosed(request, payload, body.disclosures)
    approved = database.approve_auth_request(
        uuid.UUID(request_id),
        uuid.UUID(payload["sub"]),
        disclosed,
        record_connection=kind != "login",
    )
    if not approved:
        raise HTTPException(status_code=409, detail=ALREADY_APPROVED_DETAIL)
    return ApproveOut(status="approved")


@router.post("/requests/{request_id}/reject", response_model=ApproveOut)
def reject_request(request_id: str, body: ApproveIn):
    request = _load_request(request_id)
    if request["expired"] or request["consumed"] or request["approved"]:
        raise HTTPException(status_code=409, detail=ALREADY_APPROVED_DETAIL)
    payload = _credential_payload(body.token)
    owner = request.get("credential_id")
    if owner and owner != payload["sub"]:
        raise HTTPException(status_code=401, detail=OTHER_ACCOUNT_DETAIL)
    jwk = payload.get("cnf", {}).get("jwk", {})
    if not verify_device_signature(jwk, request["challenge"], body.signature):
        raise HTTPException(status_code=401, detail=POSSESSION_DETAIL)
    if not database.reject_auth_request(uuid.UUID(request_id)):
        raise HTTPException(status_code=409, detail=ALREADY_APPROVED_DETAIL)
    return ApproveOut(status="rejected")


@router.post("/requests/{request_id}/token", response_model=TokenOut)
def deliver_token(request_id: str):
    request = _load_request(request_id)
    kind = request.get("kind") or "third_party"
    if kind == "login":
        raise HTTPException(status_code=400, detail="Esta solicitud es un inicio de sesión de ZeroID.")
    if kind == "sign_in":
        raise HTTPException(
            status_code=400,
            detail="Las solicitudes del SDK se canjean con tu client secret en /clients/{client_id}/exchange.",
        )
    if request["consumed"] and not request["approved"]:
        return TokenOut(status="rejected")
    if request["expired"] and not request["approved"]:
        raise HTTPException(status_code=410, detail=EXPIRED_DETAIL)
    if request["consumed"]:
        raise HTTPException(status_code=410, detail=ALREADY_DELIVERED_DETAIL)
    if not request["approved"]:
        return TokenOut(status="pending")

    delivered = database.consume_auth_request(uuid.UUID(request_id))
    if delivered is None:
        detail = EXPIRED_DETAIL if request["expired"] else ALREADY_DELIVERED_DETAIL
        raise HTTPException(status_code=410, detail=detail)

    token = issue_presentation(
        delivered["claims"], delivered["client_name"], PRESENTATION_TTL
    )
    return TokenOut(status="delivered", token=token, claims=delivered["claims"])


@router.post("/requests/{request_id}/session", response_model=SessionOut)
def deliver_session(request_id: str):
    request = _load_request(request_id)
    if (request.get("kind") or "third_party") != "login":
        raise HTTPException(status_code=400, detail="Esta solicitud no abre una sesión.")
    if request["consumed"] and not request["approved"]:
        return SessionOut(status="rejected")
    if request["expired"] and not request["approved"]:
        raise HTTPException(status_code=410, detail=EXPIRED_DETAIL)
    if request["consumed"]:
        raise HTTPException(status_code=410, detail=ALREADY_DELIVERED_DETAIL)
    if not request["approved"]:
        return SessionOut(status="pending")

    delivered = database.consume_auth_request(uuid.UUID(request_id))
    if delivered is None:
        raise HTTPException(status_code=410, detail=ALREADY_DELIVERED_DETAIL)
    account = database.get_account_by_credential(uuid.UUID(request["credential_id"]))
    if account is None:
        raise HTTPException(status_code=401, detail=INVALID_DETAIL)
    return SessionOut(
        status="delivered",
        session_token=issue_session(account["credential_id"], account["username"]),
        username=account["username"],
        vault_ciphertext=account["vault_ciphertext"],
        wrapped_key=account["wrapped_key"],
        wrap_salt=account["wrap_salt"],
        wrap_iterations=account["wrap_iterations"],
    )


@router.get("/inbox", response_model=InboxOut)
def inbox(authorization: Optional[str] = Header(default=None)):
    payload = _bearer(authorization)
    rows = database.list_inbox(uuid.UUID(payload["sub"]))
    return InboxOut(
        requests=[
            RequestView(
                request_id=row["request_id"],
                client_name=row["client_name"],
                client_domain=row.get("client_domain") or "",
                kind=row.get("kind") or "login",
                challenge=row["challenge"],
                fields=[_field_out(item) for item in row.get("fields") or []],
                status="pending",
                expires_in=row.get("expires_in") or 0,
            )
            for row in rows
        ]
    )


@router.get("/connections", response_model=ConnectionsOut)
def connections(authorization: Optional[str] = Header(default=None)):
    payload = _bearer(authorization, allow_session=True)
    rows = database.list_connections(uuid.UUID(payload["sub"]))
    return ConnectionsOut(
        connections=[
            ConnectionOut(
                id=row["id"],
                client_name=row["client_name"],
                client_domain=row.get("client_domain", ""),
                rules=row["rules"],
                created_at=row["created_at"].isoformat(),
            )
            for row in rows
        ]
    )


@router.post("/accounts", response_model=AccountCreated)
def create_account(body: AccountIn):
    username = _username(body.username)
    payload = _credential_payload(body.token)
    jwk = payload.get("cnf", {}).get("jwk", {})
    if not verify_device_signature(jwk, f"{REGISTER_PREFIX}{username}", body.signature):
        raise HTTPException(status_code=401, detail=POSSESSION_DETAIL)
    if body.password in body.vault_ciphertext or body.password in body.wrapped_key:
        raise HTTPException(status_code=422, detail="La bóveda tiene que ir cifrada.")

    email_hash = None
    if body.email and body.email.strip():
        email = body.email.strip().lower()
        if not EMAIL_PATTERN.match(email):
            raise HTTPException(status_code=422, detail="Ingresa un correo válido.")
        email_hash = hashing.hash_document(email)

    try:
        database.create_account(
            uuid.UUID(payload["sub"]),
            username,
            hash_password(body.password),
            email_hash,
            body.vault_ciphertext,
            body.wrapped_key,
            body.wrap_salt,
            body.wrap_iterations,
        )
    except psycopg.errors.UniqueViolation as error:
        constraint = (error.diag.constraint_name or "") if error.diag else ""
        if "username" in constraint:
            raise HTTPException(status_code=409, detail="Ese usuario ya está registrado.")
        if "email" in constraint:
            raise HTTPException(status_code=409, detail="Ese correo ya está registrado.")
        raise HTTPException(status_code=409, detail="Esta credencial ya tiene una cuenta.")

    return AccountCreated(
        username=username,
        session_token=issue_session(payload["sub"], username),
    )


@router.post("/login", response_model=AuthRequestOut)
def login(body: LoginIn, background: BackgroundTasks):
    username = body.username.strip().lower()
    account = database.get_account_by_username(username) if username else None
    if account is None or not verify_password(body.password, account["password_hash"]):
        raise HTTPException(status_code=401, detail=LOGIN_DETAIL)
    challenge = secrets.token_urlsafe(32)
    request_id = database.create_auth_request(
        "ZeroID",
        [],
        challenge,
        REQUEST_TTL_SECONDS,
        client_domain="zeroid",
        fields=[],
        kind="login",
        credential_id=account["credential_id"],
    )
    background.add_task(
        push.notify_credential,
        account["credential_id"],
        "Inicio de sesión en ZeroID",
        "¿Eres tú quien intenta entrar a tu bóveda?",
        {"request_id": request_id},
    )
    return AuthRequestOut(
        request_id=request_id, challenge=challenge, expires_in=REQUEST_TTL_SECONDS
    )


@router.post("/push-token", response_model=ApproveOut)
def register_push_token(body: PushTokenIn, authorization: Optional[str] = Header(default=None)):
    payload = _bearer(authorization)
    database.save_push_token(uuid.UUID(payload["sub"]), body.token.strip())
    return ApproveOut(status="registered")


@router.get("/accounts/me", response_model=AccountOut)
def account_me(authorization: Optional[str] = Header(default=None)):
    payload = _bearer(authorization, allow_session=True)
    account = database.get_account_by_credential(uuid.UUID(payload["sub"]))
    if account is None:
        raise HTTPException(status_code=404, detail="No hay una cuenta para esta credencial.")
    return AccountOut(username=account["username"], paired=account["paired"])


@router.post("/accounts/paired", response_model=AccountOut)
def account_paired(authorization: Optional[str] = Header(default=None)):
    payload = _bearer(authorization)
    database.mark_account_paired(uuid.UUID(payload["sub"]))
    account = database.get_account_by_credential(uuid.UUID(payload["sub"]))
    if account is None:
        raise HTTPException(status_code=404, detail="No hay una cuenta para esta credencial.")
    return AccountOut(username=account["username"], paired=True)
