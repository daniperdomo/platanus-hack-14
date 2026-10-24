import base64
import uuid
from datetime import datetime, timezone

import jwt
import pytest
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives.asymmetric.utils import decode_dss_signature

from app.core import security
from app.db import database
from tests.conftest import CLAIMS


def device_keypair():
    private = ec.generate_private_key(ec.SECP256R1())
    numbers = private.public_key().public_numbers()

    def b64(number):
        return base64.urlsafe_b64encode(number.to_bytes(32, "big")).rstrip(b"=").decode()

    jwk = {"kty": "EC", "crv": "P-256", "x": b64(numbers.x), "y": b64(numbers.y)}
    return private, jwk


def sign_challenge(private, challenge):
    der = private.sign(challenge.encode(), ec.ECDSA(hashes.SHA256()))
    r, s = decode_dss_signature(der)
    raw = r.to_bytes(32, "big") + s.to_bytes(32, "big")
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode()


@pytest.fixture
def store(monkeypatch, credential_id):
    state = {"requests": {}, "connections": [], "credentials": {credential_id}}

    def create(client_name, rules, challenge, ttl_seconds):
        request_id = str(uuid.uuid4())
        state["requests"][request_id] = {
            "client_name": client_name,
            "rules": list(rules),
            "challenge": challenge,
            "disclosed_claims": None,
            "credential_id": None,
            "approved": False,
            "consumed": False,
            "expired": False,
        }
        return request_id

    def get(request_id):
        return state["requests"].get(str(request_id))

    def approve(request_id, owner_id, claims):
        row = state["requests"].get(str(request_id))
        if row is None or row["approved"] or row["expired"]:
            return False
        row["approved"] = True
        row["disclosed_claims"] = claims
        row["credential_id"] = str(owner_id)
        state["connections"].append(
            {
                "id": str(uuid.uuid4()),
                "credential_id": str(owner_id),
                "client_name": row["client_name"],
                "rules": list(row["rules"]),
                "created_at": datetime.now(timezone.utc),
            }
        )
        return True

    def consume(request_id):
        row = state["requests"].get(str(request_id))
        if row is None or not row["approved"] or row["consumed"] or row["expired"]:
            return None
        row["consumed"] = True
        return {"client_name": row["client_name"], "claims": row["disclosed_claims"]}

    def connections(owner_id):
        return [row for row in state["connections"] if row["credential_id"] == str(owner_id)]

    monkeypatch.setattr(database, "create_auth_request", create)
    monkeypatch.setattr(database, "get_auth_request", get)
    monkeypatch.setattr(database, "approve_auth_request", approve)
    monkeypatch.setattr(database, "consume_auth_request", consume)
    monkeypatch.setattr(database, "list_connections", connections)
    monkeypatch.setattr(database, "credential_exists", lambda cid: str(cid) in state["credentials"])
    return state


def credential(credential_id, jwk):
    return security.issue_credential(CLAIMS, jwk, credential_id)


def test_third_party_receives_only_the_approved_rules(client, store, credential_id):
    private, jwk = device_keypair()
    token = credential(credential_id, jwk)
    created = client.post(
        "/auth/requests", json={"client_name": "  Tienda  ", "rules": ["mayor_de_edad", "mayor_de_edad"]}
    )
    assert created.status_code == 200
    body = created.json()
    assert body["expires_in"] == 300

    pending = client.post(f"/auth/requests/{body['request_id']}/token")
    assert pending.json()["status"] == "pending"

    approved = client.post(
        f"/auth/requests/{body['request_id']}/approve",
        json={"token": token, "signature": sign_challenge(private, body["challenge"])},
    )
    assert approved.status_code == 200

    delivered = client.post(f"/auth/requests/{body['request_id']}/token").json()
    assert delivered["status"] == "delivered"
    assert delivered["claims"] == {"mayor_de_edad": True}
    presentation = jwt.decode(delivered["token"], options={"verify_signature": False})
    assert presentation["typ"] == "presentation"
    assert presentation["aud"] == "Tienda"
    assert presentation["claims"] == {"mayor_de_edad": True}
    assert presentation["sub"] != credential_id
    assert "cnf" not in presentation

    history = client.get("/auth/connections", headers={"Authorization": f"Bearer {token}"})
    [connection] = history.json()["connections"]
    assert connection["client_name"] == "Tienda"
    assert connection["rules"] == ["mayor_de_edad"]

    assert client.post(f"/auth/requests/{body['request_id']}/token").status_code == 410


def test_approval_without_the_device_key_is_rejected(client, store, credential_id):
    private, jwk = device_keypair()
    _, other_jwk = device_keypair()
    token = credential(credential_id, other_jwk)
    created = client.post(
        "/auth/requests", json={"client_name": "Tienda", "rules": ["persona_real_unica"]}
    ).json()

    response = client.post(
        f"/auth/requests/{created['request_id']}/approve",
        json={"token": token, "signature": sign_challenge(private, created["challenge"])},
    )
    assert response.status_code == 401
    assert store["connections"] == []
    assert client.post(f"/auth/requests/{created['request_id']}/token").json()["status"] == "pending"


def test_unknown_rule_is_rejected_before_a_request_exists(client, store):
    response = client.post("/auth/requests", json={"client_name": "Tienda", "rules": ["sueldo"]})
    assert response.status_code == 400
    assert store["requests"] == {}


def test_connections_require_the_users_credential(client, store):
    assert client.get("/auth/connections").status_code == 401


def test_presentation_keeps_working_after_the_credential_is_revoked(client, store, credential_id):
    private, jwk = device_keypair()
    token = credential(credential_id, jwk)
    created = client.post(
        "/auth/requests", json={"client_name": "Tienda", "rules": ["mayor_de_edad"]}
    ).json()
    client.post(
        f"/auth/requests/{created['request_id']}/approve",
        json={"token": token, "signature": sign_challenge(private, created["challenge"])},
    )
    presentation = client.post(f"/auth/requests/{created['request_id']}/token").json()["token"]

    store["credentials"].clear()
    response = client.post(
        "/verify", json={"token": presentation, "rules": ["mayor_de_edad"]}
    )
    assert response.status_code == 200
    assert response.json() == {"valid": True, "claims": {"mayor_de_edad": True}}
    assert client.get(
        "/auth/connections", headers={"Authorization": f"Bearer {presentation}"}
    ).status_code == 401
