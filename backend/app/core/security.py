import logging
from datetime import datetime, timedelta, timezone
from functools import lru_cache
from typing import Any, Dict

import jwt
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa

from app.core.config import settings

ISSUER = "zeroid-oraculo"
ALGORITHM = "RS256"

logger = logging.getLogger(__name__)


@lru_cache
def _private_key() -> rsa.RSAPrivateKey:
    if settings.jwt_private_key:
        # Hosting dashboards often store multiline PEMs with literal "\n".
        pem = settings.jwt_private_key.replace("\\n", "\n").encode()
        return serialization.load_pem_private_key(pem, password=None)

    logger.warning(
        "JWT_PRIVATE_KEY no está definida: se usa una llave efímera y las "
        "credenciales emitidas dejan de ser válidas al reiniciar."
    )
    return rsa.generate_private_key(public_exponent=65537, key_size=2048)


def public_key() -> rsa.RSAPublicKey:
    return _private_key().public_key()


def issue_credential(
    claims: Dict[str, Any], device_public_jwk: Dict[str, Any], credential_id: str
) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "iss": ISSUER,
        "sub": credential_id,
        "iat": now,
        "exp": now + timedelta(days=settings.credential_ttl_days),
        "cnf": {"jwk": device_public_jwk},
        "claims": claims,
    }
    return jwt.encode(payload, _private_key(), algorithm=ALGORITHM)


def decode_credential(token: str) -> Dict[str, Any]:
    return jwt.decode(
        token,
        public_key(),
        algorithms=[ALGORITHM],
        issuer=ISSUER,
        options={"require": ["iss", "sub", "iat", "exp"]},
    )
