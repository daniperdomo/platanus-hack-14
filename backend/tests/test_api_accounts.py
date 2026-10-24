import uuid

import psycopg
import pytest

from app.core.passwords import hash_password, verify_password
from app.db import database
from tests.test_api_auth import credential, device_keypair, sign_challenge


class Diag:
    def __init__(self, constraint_name):
        self.constraint_name = constraint_name


@pytest.fixture
def accounts(monkeypatch, credential_id):
    state = {
        "account": None,
        "requests": {},
        "inbox": [],
        "pairings": {},
        "credentials": {credential_id},
    }

    def create_account(owner_id, username, password_hash, email_hash, ciphertext, wrapped, salt, iterations):
        if state["account"] is not None:
            error = psycopg.errors.UniqueViolation("duplicate")
            error.diag = Diag("accounts_credential_id_key")
            raise error
        state["account"] = {
            "credential_id": str(owner_id),
            "username": username,
            "password_hash": password_hash,
            "email_hash": email_hash,
            "vault_ciphertext": ciphertext,
            "wrapped_key": wrapped,
            "wrap_salt": salt,
            "wrap_iterations": iterations,
            "paired": False,
        }

    def by_username(username):
        account = state["account"]
        if account is None or account["username"] != username:
            return None
        return account

    def by_credential(owner_id):
        account = state["account"]
        if account is None or account["credential_id"] != str(owner_id):
            return None
        return account

    def create_request(client_name, rules, challenge, ttl, client_domain="", fields=None, kind="third_party", credential_id=None):
        request_id = str(uuid.uuid4())
        row = {
            "client_name": client_name,
            "client_domain": client_domain,
            "rules": list(rules),
            "fields": fields or [],
            "challenge": challenge,
            "disclosed_claims": None,
            "credential_id": str(credential_id) if credential_id else None,
            "kind": kind,
            "approved": False,
            "consumed": False,
            "expired": False,
            "expires_in": ttl,
        }
        state["requests"][request_id] = row
        if credential_id:
            state["inbox"].append((request_id, row))
        return request_id

    def get_request(request_id):
        return state["requests"].get(str(request_id))

    def approve(request_id, owner_id, claims, record_connection=True):
        row = state["requests"].get(str(request_id))
        if row is None or row["approved"]:
            return False
        row["approved"] = True
        row["disclosed_claims"] = claims
        row["credential_id"] = str(owner_id)
        return True

    def reject(request_id):
        row = state["requests"].get(str(request_id))
        if row is None or row["approved"] or row["consumed"]:
            return False
        row["consumed"] = True
        return True

    def consume(request_id):
        row = state["requests"].get(str(request_id))
        if row is None or not row["approved"] or row["consumed"]:
            return None
        row["consumed"] = True
        return {"client_name": row["client_name"], "claims": row["disclosed_claims"]}

    def inbox(owner_id):
        return [
            {
                "request_id": request_id,
                "client_name": row["client_name"],
                "client_domain": row["client_domain"],
                "fields": row["fields"],
                "challenge": row["challenge"],
                "kind": row["kind"],
                "expires_in": row["expires_in"],
            }
            for request_id, row in state["inbox"]
            if row["credential_id"] == str(owner_id) and not row["approved"]
        ]

    def mark_paired(owner_id):
        if state["account"] and state["account"]["credential_id"] == str(owner_id):
            state["account"]["paired"] = True

    monkeypatch.setattr(database, "create_account", create_account)
    monkeypatch.setattr(database, "get_account_by_username", by_username)
    monkeypatch.setattr(database, "get_account_by_credential", by_credential)
    monkeypatch.setattr(database, "create_auth_request", create_request)
    monkeypatch.setattr(database, "get_auth_request", get_request)
    monkeypatch.setattr(database, "approve_auth_request", approve)
    monkeypatch.setattr(database, "reject_auth_request", reject)
    monkeypatch.setattr(database, "consume_auth_request", consume)
    monkeypatch.setattr(database, "list_inbox", inbox)
    monkeypatch.setattr(database, "mark_account_paired", mark_paired)
    monkeypatch.setattr(database, "credential_exists", lambda cid: str(cid) in state["credentials"])
    return state


def register(client, credential_id, private, jwk, username="ana", password="secreto123"):
    token = credential(credential_id, jwk)
    return client.post(
        "/auth/accounts",
        json={
            "token": token,
            "signature": sign_challenge(private, f"zeroid-register:{username}"),
            "username": username,
            "password": password,
            "email": "ana@correo.com",
            "vault_ciphertext": "ciphertext-opaco",
            "wrapped_key": "wrapped-key",
            "wrap_salt": "c2FsdA",
            "wrap_iterations": 210000,
        },
    )


def test_password_hash_does_not_keep_the_password():
    stored = hash_password("secreto123")
    assert "secreto123" not in stored
    assert verify_password("secreto123", stored)
    assert not verify_password("otra", stored)


def test_register_stores_ciphertext_and_opens_a_session(client, accounts, credential_id):
    private, jwk = device_keypair()
    response = register(client, credential_id, private, jwk)
    assert response.status_code == 200
    body = response.json()
    assert body["username"] == "ana"
    assert accounts["account"]["vault_ciphertext"] == "ciphertext-opaco"
    assert "secreto123" not in accounts["account"]["password_hash"]
    assert accounts["account"]["email_hash"] != "ana@correo.com"
    assert "ana@correo.com" not in accounts["account"]["email_hash"]

    me = client.get("/auth/accounts/me", headers={"Authorization": f"Bearer {body['session_token']}"})
    assert me.json() == {"username": "ana", "paired": False}


def test_register_without_the_device_key_is_rejected(client, accounts, credential_id):
    private, jwk = device_keypair()
    _, other = device_keypair()
    token = credential(credential_id, other)
    response = client.post(
        "/auth/accounts",
        json={
            "token": token,
            "signature": sign_challenge(private, "zeroid-register:ana"),
            "username": "ana",
            "password": "secreto123",
            "vault_ciphertext": "ciphertext-opaco",
            "wrapped_key": "wrapped-key",
            "wrap_salt": "c2FsdA",
            "wrap_iterations": 210000,
        },
    )
    assert response.status_code == 401
    assert accounts["account"] is None


def test_plaintext_password_inside_the_vault_is_rejected(client, accounts, credential_id):
    private, jwk = device_keypair()
    token = credential(credential_id, jwk)
    response = client.post(
        "/auth/accounts",
        json={
            "token": token,
            "signature": sign_challenge(private, "zeroid-register:ana"),
            "username": "ana",
            "password": "secreto123",
            "vault_ciphertext": "secreto123-en-claro",
            "wrapped_key": "wrapped-key",
            "wrap_salt": "c2FsdA",
            "wrap_iterations": 210000,
        },
    )
    assert response.status_code == 422
    assert accounts["account"] is None


def test_login_waits_for_the_phone_and_then_returns_the_wrapped_vault(client, accounts, credential_id):
    private, jwk = device_keypair()
    register(client, credential_id, private, jwk)
    token = credential(credential_id, jwk)

    logged = client.post("/auth/login", json={"username": "Ana", "password": "secreto123"})
    assert logged.status_code == 200
    request_id = logged.json()["request_id"]
    assert client.post(f"/auth/requests/{request_id}/session").json()["status"] == "pending"

    inbox = client.get("/auth/inbox", headers={"Authorization": f"Bearer {token}"}).json()
    [prompt] = inbox["requests"]
    assert prompt["kind"] == "login"
    assert prompt["client_name"] == "ZeroID"

    approved = client.post(
        f"/auth/requests/{request_id}/approve",
        json={"token": token, "signature": sign_challenge(private, prompt["challenge"])},
    )
    assert approved.status_code == 200

    session = client.post(f"/auth/requests/{request_id}/session").json()
    assert session["status"] == "delivered"
    assert session["username"] == "ana"
    assert session["vault_ciphertext"] == "ciphertext-opaco"
    assert "password_hash" not in session
    assert client.post(f"/auth/requests/{request_id}/session").status_code == 410


def test_the_phone_can_reject_a_login(client, accounts, credential_id):
    private, jwk = device_keypair()
    register(client, credential_id, private, jwk)
    token = credential(credential_id, jwk)
    request_id = client.post("/auth/login", json={"username": "ana", "password": "secreto123"}).json()[
        "request_id"
    ]
    challenge = client.get("/auth/inbox", headers={"Authorization": f"Bearer {token}"}).json()["requests"][0][
        "challenge"
    ]
    rejected = client.post(
        f"/auth/requests/{request_id}/reject",
        json={"token": token, "signature": sign_challenge(private, challenge)},
    )
    assert rejected.status_code == 200
    assert client.post(f"/auth/requests/{request_id}/session").json()["status"] == "rejected"


def test_wrong_password_does_not_create_a_prompt(client, accounts, credential_id):
    private, jwk = device_keypair()
    register(client, credential_id, private, jwk)
    response = client.post("/auth/login", json={"username": "ana", "password": "incorrecta"})
    assert response.status_code == 401
    assert accounts["requests"] == {}


def test_pairing_payload_is_delivered_once(client, monkeypatch):
    stored = {}

    def create(payload, ttl):
        pairing_id = str(uuid.uuid4())
        stored[pairing_id] = payload
        return pairing_id

    def claim(pairing_id):
        return stored.pop(str(pairing_id), None)

    monkeypatch.setattr(database, "create_pairing", create)
    monkeypatch.setattr(database, "claim_pairing", claim)

    created = client.post("/pairings", json={"payload": "ciphertext"})
    assert created.status_code == 200
    pairing_id = created.json()["pairing_id"]
    assert client.post(f"/pairings/{pairing_id}/claim").json()["payload"] == "ciphertext"
    assert client.post(f"/pairings/{pairing_id}/claim").status_code == 410
