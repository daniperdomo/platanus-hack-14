import uuid

import numpy as np
import psycopg
import pytest

from app.core import security
from app.db import database
from tests.conftest import CLAIMS, DEVICE_JWK

pytestmark = pytest.mark.integration


@pytest.fixture(scope="module", autouse=True)
def db():
    try:
        database.init_db()
    except psycopg.OperationalError as error:
        pytest.skip(f"Postgres no disponible: {error}")
    yield
    with database.connect() as conn:
        conn.execute("DELETE FROM auth_requests WHERE client_name LIKE 'test-%%'")
        conn.execute("DELETE FROM identities WHERE document_hash LIKE 'test-%%'")


def random_embedding(seed):
    return np.random.default_rng(seed).normal(size=512).tolist()


@pytest.fixture
def identity():
    document_hash = f"test-{uuid.uuid4()}"
    embedding = random_embedding(hash(document_hash) % 2**32)
    credential_id = database.save_identity(document_hash, embedding)
    return document_hash, embedding, credential_id


def test_schema_has_vector_and_credential_columns():
    with database.connect() as conn:
        columns = dict(
            conn.execute(
                """
                SELECT column_name, udt_name FROM information_schema.columns
                WHERE table_name = 'identities'
                """
            ).fetchall()
        )
    assert columns["face_embedding"] == "vector"
    assert columns["credential_id"] == "uuid"
    assert columns["document_hash"] == "text"
    assert not {"rut", "name", "birth_date", "image"} & set(columns)


def test_save_identity_returns_random_uuid(identity):
    _, _, credential_id = identity
    assert uuid.UUID(credential_id).version == 4


def test_document_exists(identity):
    document_hash, _, _ = identity
    assert database.document_exists(document_hash)
    assert not database.document_exists(f"test-{uuid.uuid4()}")


def test_duplicate_document_hash_raises_unique_violation(identity):
    document_hash, embedding, _ = identity
    with pytest.raises(psycopg.errors.UniqueViolation):
        database.save_identity(document_hash, embedding)


def test_same_face_is_detected_by_cosine_distance(identity):
    _, embedding, _ = identity
    near = (np.array(embedding) + np.random.default_rng(1).normal(scale=0.05, size=512)).tolist()
    assert database.face_exists(embedding)
    assert database.face_exists(near)


def test_different_face_is_not_a_duplicate(identity):
    assert not database.face_exists(random_embedding(seed=987654321))


def test_authorization_records_the_app_and_not_the_person(identity):
    _, _, credential_id = identity
    request_id = database.create_auth_request("test-tienda", ["mayor_de_edad"], "challenge", 300)
    approved = database.approve_auth_request(
        uuid.UUID(request_id), uuid.UUID(credential_id), {"mayor_de_edad": True}
    )
    assert approved

    request = database.get_auth_request(uuid.UUID(request_id))
    assert request["approved"]
    assert request["disclosed_claims"] == {"mayor_de_edad": True}
    assert database.consume_auth_request(uuid.UUID(request_id))["claims"] == {"mayor_de_edad": True}
    assert database.consume_auth_request(uuid.UUID(request_id)) is None

    [connection] = database.list_connections(uuid.UUID(credential_id))
    assert connection["client_name"] == "test-tienda"
    assert connection["rules"] == ["mayor_de_edad"]

    with database.connect() as conn:
        columns = {
            row[0]
            for row in conn.execute(
                """
                SELECT column_name FROM information_schema.columns
                WHERE table_name IN ('auth_requests', 'connections')
                """
            ).fetchall()
        }
    assert not {"rut", "name", "birth_date", "image", "document_hash"} & columns


def test_credential_exists(identity):
    _, _, credential_id = identity
    assert database.credential_exists(uuid.UUID(credential_id))
    assert not database.credential_exists(uuid.uuid4())


def test_verify_end_to_end_and_revocation(client, identity):
    document_hash, _, credential_id = identity
    token = security.issue_credential(CLAIMS, DEVICE_JWK, credential_id)

    response = client.post("/verify", json={"token": token})
    assert response.status_code == 200
    assert response.json() == {"valid": True, "claims": CLAIMS}

    with database.connect() as conn:
        conn.execute("DELETE FROM identities WHERE document_hash = %s", (document_hash,))
    assert client.post("/verify", json={"token": token}).status_code == 401
