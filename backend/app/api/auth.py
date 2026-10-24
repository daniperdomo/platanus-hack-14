import secrets
import uuid
from datetime import timedelta
from typing import Any, Dict, List, Optional

import jwt
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field

from app.core.security import (
    decode_credential,
    issue_presentation,
    verify_device_signature,
)
from app.db import database

router = APIRouter(prefix="/auth")

KNOWN_RULES = ("persona_real_unica", "mayor_de_edad", "nacionalidad")
REQUEST_TTL_SECONDS = 300
PRESENTATION_TTL = timedelta(minutes=10)

INVALID_DETAIL = "Credencial inválida, expirada o revocada."
NOT_FOUND_DETAIL = "Solicitud de autorización no encontrada."
EXPIRED_DETAIL = "La solicitud expiró. Pide una nueva."
ALREADY_APPROVED_DETAIL = "Esta solicitud ya fue autorizada."
ALREADY_DELIVERED_DETAIL = "Este token ya fue entregado."
PENDING_DETAIL = "La solicitud sigue pendiente."
POSSESSION_DETAIL = "No pudimos comprobar que la credencial está en este dispositivo."


class AuthRequestIn(BaseModel):
    client_name: str = Field(min_length=1, max_length=80)
    rules: List[str] = Field(min_length=1)


class AuthRequestOut(BaseModel):
    request_id: str
    challenge: str
    expires_in: int


class ApproveIn(BaseModel):
    token: str
    signature: str


class ApproveOut(BaseModel):
    status: str


class TokenOut(BaseModel):
    status: str
    token: Optional[str] = None
    claims: Optional[Dict[str, Any]] = None


class ConnectionOut(BaseModel):
    id: str
    client_name: str
    rules: List[str]
    created_at: str


class ConnectionsOut(BaseModel):
    connections: List[ConnectionOut]


def _unknown_rules(rules: List[str]) -> List[str]:
    return [rule for rule in rules if rule not in KNOWN_RULES]


def _load_request(request_id: str) -> dict:
    try:
        parsed = uuid.UUID(request_id)
    except ValueError:
        raise HTTPException(status_code=404, detail=NOT_FOUND_DETAIL)
    request = database.get_auth_request(parsed)
    if request is None:
        raise HTTPException(status_code=404, detail=NOT_FOUND_DETAIL)
    return request


def _credential_payload(token: str) -> dict:
    try:
        payload = decode_credential(token)
        if payload.get("typ") == "presentation":
            raise ValueError
        credential_id = uuid.UUID(payload["sub"])
    except (jwt.InvalidTokenError, ValueError):
        raise HTTPException(status_code=401, detail=INVALID_DETAIL)
    if not database.credential_exists(credential_id):
        raise HTTPException(status_code=401, detail=INVALID_DETAIL)
    return payload


@router.post("/requests", response_model=AuthRequestOut)
def create_request(body: AuthRequestIn):
    client_name = body.client_name.strip()
    if not client_name:
        raise HTTPException(status_code=422, detail="El nombre de la aplicación no puede estar vacío.")
    unknown = _unknown_rules(body.rules)
    if unknown:
        raise HTTPException(status_code=400, detail=f"Reglas desconocidas: {', '.join(unknown)}")

    rules = list(dict.fromkeys(body.rules))
    challenge = secrets.token_urlsafe(32)
    request_id = database.create_auth_request(
        client_name, rules, challenge, REQUEST_TTL_SECONDS
    )
    return AuthRequestOut(
        request_id=request_id, challenge=challenge, expires_in=REQUEST_TTL_SECONDS
    )


@router.post("/requests/{request_id}/approve", response_model=ApproveOut)
def approve_request(request_id: str, body: ApproveIn):
    request = _load_request(request_id)
    if request["expired"]:
        raise HTTPException(status_code=410, detail=EXPIRED_DETAIL)
    if request["approved"] or request["consumed"]:
        raise HTTPException(status_code=409, detail=ALREADY_APPROVED_DETAIL)

    payload = _credential_payload(body.token)
    jwk = payload.get("cnf", {}).get("jwk", {})
    if not verify_device_signature(jwk, request["challenge"], body.signature):
        raise HTTPException(status_code=401, detail=POSSESSION_DETAIL)

    claims = payload["claims"]
    unknown = [rule for rule in request["rules"] if rule not in claims]
    if unknown:
        raise HTTPException(status_code=400, detail=f"Reglas desconocidas: {', '.join(unknown)}")

    disclosed = {rule: claims[rule] for rule in request["rules"]}
    approved = database.approve_auth_request(
        uuid.UUID(request_id), uuid.UUID(payload["sub"]), disclosed
    )
    if not approved:
        raise HTTPException(status_code=409, detail=ALREADY_APPROVED_DETAIL)
    return ApproveOut(status="approved")


@router.post("/requests/{request_id}/token", response_model=TokenOut)
def deliver_token(request_id: str):
    request = _load_request(request_id)
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


@router.get("/connections", response_model=ConnectionsOut)
def connections(authorization: Optional[str] = Header(default=None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail=INVALID_DETAIL)
    payload = _credential_payload(authorization.removeprefix("Bearer ").strip())
    rows = database.list_connections(uuid.UUID(payload["sub"]))
    return ConnectionsOut(
        connections=[
            ConnectionOut(
                id=row["id"],
                client_name=row["client_name"],
                rules=row["rules"],
                created_at=row["created_at"].isoformat(),
            )
            for row in rows
        ]
    )
