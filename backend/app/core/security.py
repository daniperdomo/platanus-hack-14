import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict

import jwt

from app.core.config import settings

ISSUER = "zeroid-oraculo"


def issue_credential(claims: Dict[str, Any], device_public_jwk: Dict[str, Any]) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "iss": ISSUER,
        "sub": str(uuid.uuid4()),
        "iat": now,
        "exp": now + timedelta(days=settings.credential_ttl_days),
        "cnf": {"jwk": device_public_jwk},
        "claims": claims,
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_credential(token: str) -> Dict[str, Any]:
    return jwt.decode(
        token,
        settings.jwt_secret,
        algorithms=[settings.jwt_algorithm],
        issuer=ISSUER,
    )
