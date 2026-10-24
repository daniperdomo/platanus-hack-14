import base64
import logging
import uuid
from datetime import datetime, timedelta, timezone
from functools import lru_cache
from typing import Any, Dict

import jwt
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec, rsa
from cryptography.hazmat.primitives.asymmetric.utils import encode_dss_signature
from jwt import PyJWK

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
        options={"require": ["iss", "sub", "iat", "exp"], "verify_aud": False},
    )


def issue_presentation(claims: Dict[str, Any], audience: str, ttl: timedelta) -> str:
    """Short-lived token for one third party. It carries only the claims just disclosed."""
    now = datetime.now(timezone.utc)
    payload = {
        "iss": ISSUER,
        "sub": str(uuid.uuid4()),
        "aud": audience,
        "iat": now,
        "exp": now + ttl,
        "typ": "presentation",
        "claims": claims,
    }
    return jwt.encode(payload, _private_key(), algorithm=ALGORITHM)


def _b64url_decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(value + padding)


def verify_device_signature(jwk: Dict[str, Any], message: str, signature: str) -> bool:
    """Web Crypto signs the challenge as raw P-256 ECDSA (r || s), base64url."""
    try:
        if jwk.get("kty") != "EC" or jwk.get("crv") != "P-256":
            return False
        public_key = PyJWK.from_dict(
            {"kty": "EC", "crv": "P-256", "x": jwk["x"], "y": jwk["y"]}
        ).key
        raw = _b64url_decode(signature)
        if len(raw) != 64:
            return False
        der = encode_dss_signature(
            int.from_bytes(raw[:32], "big"),
            int.from_bytes(raw[32:], "big"),
        )
        public_key.verify(der, message.encode(), ec.ECDSA(hashes.SHA256()))
        return True
    except Exception:
        return False
