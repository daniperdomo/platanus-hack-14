import jwt
import pytest
from jwt import PyJWK

from app.db import database
from app.services import push
from tests.test_api_accounts import accounts, register  # noqa: F401
from tests.test_api_auth import credential, device_keypair, sign_challenge

ORIGIN = "https://expresocaribe.com"


@pytest.fixture
def clients(monkeypatch):
    stored = {}

    def create(client_id, secret_hash, name, origins, redirect_uri):
        stored[client_id] = {
            "client_id": client_id,
            "secret_hash": secret_hash,
            "name": name,
            "origins": origins,
            "redirect_uri": redirect_uri,
        }

    monkeypatch.setattr(database, "create_client", create)
    monkeypatch.setattr(database, "get_client", lambda client_id: stored.get(client_id))
    return stored


@pytest.fixture
def pushes(monkeypatch):
    sent = []
    monkeypatch.setattr(push, "notify_credential", lambda *args: sent.append(args))
    return sent


def new_client(client, name="Expreso Caribe", origins=(ORIGIN,)):
    response = client.post("/clients", json={"name": name, "origins": list(origins)})
    assert response.status_code == 200
    return response.json()


def approve_from_phone(client, credential_id, private, jwk):
    token = credential(credential_id, jwk)
    [prompt] = client.get("/auth/inbox", headers={"Authorization": f"Bearer {token}"}).json()["requests"]
    response = client.post(
        f"/auth/requests/{prompt['request_id']}/approve",
        json={"token": token, "signature": sign_challenge(private, prompt["challenge"])},
    )
    assert response.status_code == 200
    return prompt


def test_registered_client_keeps_only_a_hash_of_the_secret(client, clients):
    created = new_client(client, origins=["https://ExpresoCaribe.com/boletos", "http://localhost:3000"])
    assert created["client_id"].startswith("zid_live_")
    assert created["origins"] == ["http://localhost:3000", ORIGIN]
    stored = clients[created["client_id"]]
    assert created["client_secret"] not in stored["secret_hash"]

    public = client.get(f"/clients/{created['client_id']}").json()
    assert public == {"client_id": created["client_id"], "name": "Expreso Caribe", "origins": created["origins"]}


def test_plain_http_origins_are_refused(client, clients):
    response = client.post("/clients", json={"name": "Tienda", "origins": ["http://tienda.com"]})
    assert response.status_code == 422


def test_sign_in_notifies_the_phone_and_shares_no_personal_data(client, clients, accounts, pushes, credential_id):
    private, jwk = device_keypair()
    register(client, credential_id, private, jwk)
    app = new_client(client)

    started = client.post(
        "/auth/sign-in",
        json={"client_id": app["client_id"], "origin": ORIGIN, "username": "Ana", "scopes": ["persona_real_unica"]},
    )
    assert started.status_code == 200
    body = started.json()
    assert body["notified"] is True
    assert body["approve_uri"] == f"zeroid://approve?request={body['request_id']}"
    [(owner, title, _, data)] = pushes
    assert owner == credential_id
    assert "Expreso Caribe" in title
    assert data == {"request_id": body["request_id"]}

    exchange_url = f"/clients/{app['client_id']}/exchange"
    secret = {"Authorization": f"Bearer {app['client_secret']}"}
    assert client.post(exchange_url, json={"request_id": body["request_id"]}, headers=secret).json()["status"] == "pending"

    prompt = approve_from_phone(client, credential_id, private, jwk)
    assert prompt["kind"] == "sign_in"
    assert [field["field"] for field in prompt["fields"]] == ["persona_real_unica"]

    assert client.post(f"/auth/requests/{body['request_id']}/token").status_code == 400
    wrong = client.post(exchange_url, json={"request_id": body["request_id"]}, headers={"Authorization": "Bearer otro"})
    assert wrong.status_code == 401

    delivered = client.post(exchange_url, json={"request_id": body["request_id"]}, headers=secret).json()
    assert delivered["status"] == "delivered"
    assert delivered["claims"] == {"persona_real_unica": True}
    assert credential_id not in delivered["subject"]

    [key] = client.get("/.well-known/jwks.json").json()["keys"]
    decoded = jwt.decode(delivered["token"], PyJWK.from_dict(key).key, algorithms=["RS256"], audience=app["client_id"])
    assert decoded["sub"] == delivered["subject"]
    assert decoded["claims"] == {"persona_real_unica": True}
    assert jwt.get_unverified_header(delivered["token"])["kid"] == key["kid"]

    again = client.post(exchange_url, json={"request_id": body["request_id"]}, headers=secret)
    assert again.status_code == 410


def test_each_site_sees_a_different_subject_for_the_same_person(client, clients, accounts, pushes, credential_id):
    private, jwk = device_keypair()
    register(client, credential_id, private, jwk)
    subjects = []
    for name, origin in (("Expreso Caribe", ORIGIN), ("Yummy", "https://yummy.cl")):
        app = new_client(client, name=name, origins=[origin])
        started = client.post(
            "/auth/sign-in", json={"client_id": app["client_id"], "origin": origin, "username": "ana"}
        ).json()
        approve_from_phone(client, credential_id, private, jwk)
        delivered = client.post(
            f"/clients/{app['client_id']}/exchange",
            json={"request_id": started["request_id"]},
            headers={"Authorization": f"Bearer {app['client_secret']}"},
        ).json()
        subjects.append(delivered["subject"])
    assert subjects[0] != subjects[1]


def test_sign_in_rejects_foreign_origins_and_personal_scopes(client, clients, accounts, pushes):
    app = new_client(client)
    foreign = client.post("/auth/sign-in", json={"client_id": app["client_id"], "origin": "https://otro.com"})
    assert foreign.status_code == 403
    personal = client.post(
        "/auth/sign-in", json={"client_id": app["client_id"], "origin": ORIGIN, "scopes": ["email"]}
    )
    assert personal.status_code == 400
    unknown_user = client.post(
        "/auth/sign-in", json={"client_id": app["client_id"], "origin": ORIGIN, "username": "nadie"}
    )
    assert unknown_user.status_code == 404
    assert pushes == []


def test_sign_in_can_ask_for_personal_data_the_user_approves(client, clients, accounts, pushes, credential_id):
    private, jwk = device_keypair()
    register(client, credential_id, private, jwk)
    app = new_client(client)
    started = client.post(
        "/auth/sign-in",
        json={
            "client_id": app["client_id"],
            "origin": ORIGIN,
            "username": "ana",
            "fields": [
                {"field": "nombre", "purpose": "Emitir tu boleto.", "retention": "1 año."},
                {"field": "telefono", "purpose": "Avisarte de retrasos.", "required": False},
            ],
        },
    ).json()
    [(_, _, body, _)] = pushes
    assert "datos" in body

    token = credential(credential_id, jwk)
    [prompt] = client.get("/auth/inbox", headers={"Authorization": f"Bearer {token}"}).json()["requests"]
    assert [(item["field"], item["required"]) for item in prompt["fields"]] == [
        ("persona_real_unica", True),
        ("nombre", True),
        ("telefono", False),
    ]
    assert prompt["fields"][2]["retention"] == "No se indicó."
    approved = client.post(
        f"/auth/requests/{prompt['request_id']}/approve",
        json={
            "token": token,
            "signature": sign_challenge(private, prompt["challenge"]),
            "disclosures": {"nombre": "Ana Pérez"},
        },
    )
    assert approved.status_code == 200

    delivered = client.post(
        f"/clients/{app['client_id']}/exchange",
        json={"request_id": started["request_id"]},
        headers={"Authorization": f"Bearer {app['client_secret']}"},
    ).json()
    assert delivered["claims"] == {"persona_real_unica": True, "nombre": "Ana Pérez"}


@pytest.mark.parametrize(
    "field",
    [{"field": "nombre"}, {"field": "persona_real_unica", "purpose": "x"}, {"field": "sangre", "purpose": "x"}],
)
def test_personal_fields_need_a_known_name_and_a_purpose(client, clients, accounts, pushes, field):
    app = new_client(client)
    response = client.post(
        "/auth/sign-in", json={"client_id": app["client_id"], "origin": ORIGIN, "fields": [field]}
    )
    assert response.status_code in (400, 422)
    assert pushes == []


def test_another_app_cannot_exchange_the_request(client, clients, accounts, pushes, credential_id):
    private, jwk = device_keypair()
    register(client, credential_id, private, jwk)
    app = new_client(client)
    other = new_client(client, name="Otra", origins=["https://otra.com"])
    started = client.post(
        "/auth/sign-in", json={"client_id": app["client_id"], "origin": ORIGIN, "username": "ana"}
    ).json()
    approve_from_phone(client, credential_id, private, jwk)
    stolen = client.post(
        f"/clients/{other['client_id']}/exchange",
        json={"request_id": started["request_id"]},
        headers={"Authorization": f"Bearer {other['client_secret']}"},
    )
    assert stolen.status_code == 404
