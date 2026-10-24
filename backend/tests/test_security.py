import base64
import json
from datetime import timedelta

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import rsa

from app.core import security
from tests.conftest import CLAIMS, DEVICE_JWK, base_payload, sign


def test_token_is_rs256(valid_token):
    assert jwt.get_unverified_header(valid_token)["alg"] == "RS256"


def test_roundtrip_keeps_claims_device_key_and_sub(valid_token, credential_id):
    payload = security.decode_credential(valid_token)
    assert payload["claims"] == CLAIMS
    assert payload["cnf"]["jwk"] == DEVICE_JWK
    assert payload["sub"] == credential_id
    assert payload["iss"] == security.ISSUER


def test_token_does_not_carry_personal_data(valid_token):
    payload = jwt.decode(valid_token, options={"verify_signature": False})
    assert set(payload) == {"iss", "sub", "iat", "exp", "cnf", "claims"}
    assert set(payload["claims"]) == {"persona_real_unica", "mayor_de_edad", "nacionalidad"}


def test_expired_token_is_rejected(credential_id):
    payload = base_payload(credential_id)
    payload["exp"] = payload["iat"] - timedelta(seconds=1)
    with pytest.raises(jwt.ExpiredSignatureError):
        security.decode_credential(sign(payload))


def test_hs256_forgery_is_rejected(credential_id):
    forged = sign(base_payload(credential_id), key="dev-secret-change-me", algorithm="HS256")
    with pytest.raises(jwt.InvalidTokenError):
        security.decode_credential(forged)


def test_alg_none_is_rejected(credential_id):
    unsigned = jwt.encode(base_payload(credential_id), key=None, algorithm="none")
    with pytest.raises(jwt.InvalidTokenError):
        security.decode_credential(unsigned)


def test_token_signed_by_another_key_is_rejected(credential_id):
    other_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    with pytest.raises(jwt.InvalidSignatureError):
        security.decode_credential(sign(base_payload(credential_id), key=other_key))


def test_tampered_payload_is_rejected(valid_token):
    header, payload, signature = valid_token.split(".")
    data = json.loads(base64.urlsafe_b64decode(payload + "=" * (-len(payload) % 4)))
    data["claims"]["mayor_de_edad"] = not data["claims"]["mayor_de_edad"]
    tampered = base64.urlsafe_b64encode(json.dumps(data).encode()).rstrip(b"=").decode()
    with pytest.raises(jwt.InvalidSignatureError):
        security.decode_credential(f"{header}.{tampered}.{signature}")


def test_wrong_issuer_is_rejected(credential_id):
    with pytest.raises(jwt.InvalidIssuerError):
        security.decode_credential(sign(base_payload(credential_id, iss="otro-emisor")))


@pytest.mark.parametrize("claim", ["sub", "exp", "iat", "iss"])
def test_required_claims(credential_id, claim):
    payload = base_payload(credential_id)
    del payload[claim]
    with pytest.raises(jwt.InvalidTokenError):
        security.decode_credential(sign(payload))
