import uuid
from typing import Any, Dict, List, Optional

import jwt
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.core.security import decode_credential
from app.db import database

router = APIRouter()

INVALID_DETAIL = "Credencial inválida, expirada o revocada."


class VerifyRequest(BaseModel):
    token: str
    rules: Optional[List[str]] = None


class VerifyResponse(BaseModel):
    valid: bool
    claims: Dict[str, Any]


@router.post("/verify", response_model=VerifyResponse)
def verify(request: VerifyRequest):
    try:
        payload = decode_credential(request.token)
        credential_id = uuid.UUID(payload["sub"])
    except (jwt.InvalidTokenError, ValueError):
        raise HTTPException(status_code=401, detail=INVALID_DETAIL)

    if not database.credential_exists(credential_id):
        raise HTTPException(status_code=401, detail=INVALID_DETAIL)

    claims = payload["claims"]
    if request.rules is None:
        return VerifyResponse(valid=True, claims=claims)

    unknown = [rule for rule in request.rules if rule not in claims]
    if unknown:
        raise HTTPException(status_code=400, detail=f"Reglas desconocidas: {', '.join(unknown)}")

    return VerifyResponse(valid=True, claims={rule: claims[rule] for rule in request.rules})
