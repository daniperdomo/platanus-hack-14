import base64
import uuid
from datetime import datetime, timedelta, timezone
from functools import lru_cache
import json
from typing import Any, Dict, Optional

import jwt
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec, rsa
from cryptography.hazmat.primitives.asymmetric.utils import encode_dss_signature
from jwt import PyJWK

from app.core.config import settings

ISSUER = "zeroid-oraculo"
ALGORITHM = "RS256"

DEVICE_JWK_FIELDS = ("kty", "crv", "x", "y")
INVALID_DEVICE_JWK_DETAIL = "La llave del dispositivo no es válida: se espera una llave pública EC P-256."
PRIVATE_DEVICE_JWK_DETAIL = "La llave del dispositivo incluye su parte privada. Envía solo la llave pública."


@lru_cache
def _private_key() -> rsa.RSAPrivateKey:
    if not settings.jwt_private_key.strip():
        raise RuntimeError("JWT_PRIVATE_KEY no está definida: no se pueden firmar credenciales.")
    # Hosting dashboards often store multiline PEMs with literal "\n".
    pem = settings.jwt_private_key.replace("\\n", "\n").encode()
    return serialization.load_pem_private_key(pem, password=None)


def parse_device_jwk(raw: str) -> Dict[str, str]:
    """Return only the public P-256 coordinates; anything else never reaches the token."""
    try:
        jwk = json.loads(raw)
    except json.JSONDecodeError:
        raise ValueError(INVALID_DEVICE_JWK_DETAIL)
    if not isinstance(jwk, dict):
        raise ValueError(INVALID_DEVICE_JWK_DETAIL)
    if "d" in jwk:
        raise ValueError(PRIVATE_DEVICE_JWK_DETAIL)
    if jwk.get("kty") != "EC" or jwk.get("crv") != "P-256":
        raise ValueError(INVALID_DEVICE_JWK_DETAIL)
    if not (isinstance(jwk.get("x"), str) and isinstance(jwk.get("y"), str)):
        raise ValueError(INVALID_DEVICE_JWK_DETAIL)

    public = {field: jwk[field] for field in DEVICE_JWK_FIELDS}
    try:
        # Rejects coordinates of the wrong size or that are not a point on the curve.
        PyJWK.from_dict(public)
    except Exception:
        raise ValueError(INVALID_DEVICE_JWK_DETAIL)
    return public


def public_key() -> rsa.RSAPublicKey:
    return _private_key().public_key()


KEY_ID = "zeroid-oraculo-1"


def public_jwk() -> Dict[str, Any]:
    jwk = json.loads(jwt.algorithms.RSAAlgorithm.to_jwk(public_key()))
    return {**jwk, "kid": KEY_ID, "use": "sig", "alg": ALGORITHM}


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


def issue_session(credential_id: str, username: str) -> str:
    """Browser session. It cannot sign challenges; the private key stays on the phone."""
    now = datetime.now(timezone.utc)
    payload = {
        "iss": ISSUER,
        "sub": credential_id,
        "iat": now,
        "exp": now + timedelta(hours=12),
        "typ": "session",
        "username": username,
    }
    return jwt.encode(payload, _private_key(), algorithm=ALGORITHM)


def issue_presentation(
    claims: Dict[str, Any], audience: str, ttl: timedelta, subject: Optional[str] = None
) -> str:
    """Short-lived token for one third party. It carries only the claims just disclosed."""
    now = datetime.now(timezone.utc)
    payload = {
        "iss": ISSUER,
        "sub": subject or str(uuid.uuid4()),
        "aud": audience,
        "iat": now,
        "exp": now + ttl,
        "typ": "presentation",
        "claims": claims,
    }
    return jwt.encode(payload, _private_key(), algorithm=ALGORITHM, headers={"kid": KEY_ID})


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
