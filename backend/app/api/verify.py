from typing import Dict, List

import jwt
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.core.security import decode_credential

router = APIRouter()


class VerifyRequest(BaseModel):
    token: str
    rules: List[str]


class VerifyResponse(BaseModel):
    valid: bool
    results: Dict[str, object]


@router.post("/verify", response_model=VerifyResponse)
def verify(request: VerifyRequest):
    try:
        payload = decode_credential(request.token)
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Credencial inválida o expirada.")

    claims = payload["claims"]
    unknown = [rule for rule in request.rules if rule not in claims]
    if unknown:
        raise HTTPException(status_code=400, detail=f"Reglas desconocidas: {', '.join(unknown)}")

    results = {rule: claims[rule] for rule in request.rules}
    return VerifyResponse(valid=True, results=results)
