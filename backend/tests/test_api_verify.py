import pytest

from app.db import database
from tests.conftest import CLAIMS, base_payload, sign


@pytest.fixture
def known_credentials(monkeypatch, credential_id):
    known = {credential_id}
    monkeypatch.setattr(database, "credential_exists", lambda cid: str(cid) in known)
    return known


def test_valid_token_returns_all_claims(client, valid_token, known_credentials):
    response = client.post("/verify", json={"token": valid_token})
    assert response.status_code == 200
    assert response.json() == {"valid": True, "claims": CLAIMS}


def test_rules_return_only_requested_claims(client, valid_token, known_credentials):
    response = client.post("/verify", json={"token": valid_token, "rules": ["mayor_de_edad"]})
    assert response.status_code == 200
    assert response.json() == {"valid": True, "claims": {"mayor_de_edad": True}}


def test_empty_rules_disclose_nothing(client, valid_token, known_credentials):
    response = client.post("/verify", json={"token": valid_token, "rules": []})
    assert response.json() == {"valid": True, "claims": {}}


def test_unknown_rule_is_400(client, valid_token, known_credentials):
    response = client.post("/verify", json={"token": valid_token, "rules": ["sueldo"]})
    assert response.status_code == 400
    assert "sueldo" in response.json()["detail"]


def test_revoked_or_unknown_credential_is_401(client, valid_token, known_credentials):
    known_credentials.clear()
    response = client.post("/verify", json={"token": valid_token})
    assert response.status_code == 401


@pytest.mark.parametrize(
    "token",
    ["", "basura", "abc.def.ghi"],
)
def test_malformed_token_is_401(client, token, known_credentials):
    assert client.post("/verify", json={"token": token}).status_code == 401


def test_expired_token_is_401(client, credential_id, known_credentials):
    payload = base_payload(credential_id)
    payload["exp"] = payload["iat"]
    assert client.post("/verify", json={"token": sign(payload)}).status_code == 401


def test_hs256_forgery_is_401(client, credential_id, known_credentials):
    forged = sign(base_payload(credential_id), key="dev-secret-change-me", algorithm="HS256")
    assert client.post("/verify", json={"token": forged}).status_code == 401


def test_non_uuid_sub_is_401(client, known_credentials):
    token = sign(base_payload("no-es-un-uuid"))
    assert client.post("/verify", json={"token": token}).status_code == 401


def test_missing_token_is_422_with_pydantic_detail(client):
    response = client.post("/verify", json={})
    assert response.status_code == 422
    detail = response.json()["detail"]
    assert isinstance(detail, list) and detail[0]["msg"]


def test_401_detail_is_a_string(client, known_credentials):
    detail = client.post("/verify", json={"token": "basura"}).json()["detail"]
    assert isinstance(detail, str)
