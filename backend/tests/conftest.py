import json
import os
import uuid
from datetime import datetime, timedelta, timezone

import cv2
import jwt
import numpy as np
import pytest
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ec, rsa
from fastapi.testclient import TestClient

# Settings are read on import, so the secrets the app now requires must exist first.
os.environ["JWT_PRIVATE_KEY"] = (
    rsa.generate_private_key(public_exponent=65537, key_size=2048)
    .private_bytes(
        serialization.Encoding.PEM,
        serialization.PrivateFormat.PKCS8,
        serialization.NoEncryption(),
    )
    .decode()
)
os.environ["HASH_PEPPER"] = "pepper-de-pruebas"

from app.core import security  # noqa: E402
from app.main import app  # noqa: E402

CLAIMS = {"persona_real_unica": True, "mayor_de_edad": True, "nacionalidad": "CL"}
DEVICE_KEY = ec.generate_private_key(ec.SECP256R1())
DEVICE_JWK = {
    field: value
    for field, value in json.loads(jwt.algorithms.ECAlgorithm.to_jwk(DEVICE_KEY.public_key())).items()
    if field in security.DEVICE_JWK_FIELDS
}


@pytest.fixture
def client():
    # Without the context manager the lifespan (DB + model warmup) never runs.
    return TestClient(app)


@pytest.fixture
def jpeg_bytes():
    image = np.full((64, 64, 3), 200, dtype=np.uint8)
    ok, encoded = cv2.imencode(".jpg", image)
    assert ok
    return encoded.tobytes()


@pytest.fixture
def credential_id():
    return str(uuid.uuid4())


@pytest.fixture
def valid_token(credential_id):
    return security.issue_credential(CLAIMS, DEVICE_JWK, credential_id)


def sign(payload, key=None, algorithm="RS256"):
    return jwt.encode(payload, key or security._private_key(), algorithm=algorithm)


def base_payload(credential_id, **overrides):
    now = datetime.now(timezone.utc)
    payload = {
        "iss": security.ISSUER,
        "sub": credential_id,
        "iat": now,
        "exp": now + timedelta(days=1),
        "cnf": {"jwk": DEVICE_JWK},
        "claims": CLAIMS,
    }
    payload.update(overrides)
    return payload
