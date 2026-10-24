import uuid
from datetime import datetime, timedelta, timezone

import cv2
import jwt
import numpy as np
import pytest
from fastapi.testclient import TestClient

from app.core import security
from app.main import app

CLAIMS = {"persona_real_unica": True, "mayor_de_edad": True, "nacionalidad": "CL"}
DEVICE_JWK = {"kty": "EC", "crv": "P-256", "x": "test-x", "y": "test-y"}


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
