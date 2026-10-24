import json
import uuid
from datetime import date

import psycopg
import pytest

from app.api.ingest import DUPLICATE_DETAIL, NO_FACE_DETAIL
from app.core import security
from app.db import database
from app.services import face, passport
from app.services.passport import PassportData
from tests.conftest import DEVICE_JWK

ADULT = PassportData(document_id="CHL-AB1234567", birth_date=date(1990, 3, 15), nationality="CL")


@pytest.fixture
def pipeline(monkeypatch):
    """Replace the MRZ reader, DeepFace and the DB with controllable fakes."""
    state = {
        "document": ADULT,
        "faces_match": True,
        "document_exists": False,
        "face_exists": False,
        "saved": [],
        "credential_id": str(uuid.uuid4()),
    }

    def read_passport(_image_bytes):
        if isinstance(state["document"], Exception):
            raise state["document"]
        return state["document"]

    def faces_match(_selfie, _document):
        if isinstance(state["faces_match"], Exception):
            raise state["faces_match"]
        return state["faces_match"]

    def save_identity(document_hash, embedding):
        if state.get("save_error"):
            raise state["save_error"]
        state["saved"].append((document_hash, embedding))
        return state["credential_id"]

    monkeypatch.setattr(passport, "read_passport", read_passport)
    monkeypatch.setattr(face, "faces_match", faces_match)
    monkeypatch.setattr(face, "embed_face", lambda _selfie: [0.1] * 512)
    monkeypatch.setattr(database, "document_exists", lambda _h: state["document_exists"])
    monkeypatch.setattr(database, "face_exists", lambda _e: state["face_exists"])
    monkeypatch.setattr(database, "save_identity", save_identity)
    return state


def post_ingest(client, jpeg, **fields):
    data = {"device_public_jwk": json.dumps(DEVICE_JWK), **fields}
    files = {
        "selfie": ("selfie.jpg", jpeg, "image/jpeg"),
        "document": ("documento.jpg", jpeg, "image/jpeg"),
    }
    return client.post("/ingest", data=data, files=files)


def test_happy_path_issues_bound_credential(client, jpeg_bytes, pipeline):
    response = post_ingest(client, jpeg_bytes)
    assert response.status_code == 200

    body = response.json()
    assert body["claims"] == {"persona_real_unica": True, "mayor_de_edad": True, "nacionalidad": "CL"}

    payload = security.decode_credential(body["token"])
    assert payload["sub"] == pipeline["credential_id"]
    assert payload["cnf"]["jwk"] == DEVICE_JWK
    assert payload["claims"] == body["claims"]


def test_only_hash_and_embedding_are_persisted(client, jpeg_bytes, pipeline):
    post_ingest(client, jpeg_bytes)
    [(document_hash, embedding)] = pipeline["saved"]
    assert "AB1234567" not in document_hash and len(document_hash) == 64
    assert len(embedding) == 512


def test_minor_gets_mayor_de_edad_false(client, jpeg_bytes, pipeline):
    pipeline["document"] = PassportData(
        document_id="CHL-AB1234567", birth_date=date(date.today().year - 10, 1, 1), nationality="CL"
    )
    assert post_ingest(client, jpeg_bytes).json()["claims"]["mayor_de_edad"] is False


def test_nationality_comes_from_the_passport_not_the_client(client, jpeg_bytes, pipeline):
    response = post_ingest(client, jpeg_bytes, nationality="VE")
    assert response.status_code == 200
    assert response.json()["claims"]["nacionalidad"] == "CL"


def test_unreadable_image_is_422(client, pipeline):
    response = post_ingest(client, b"no soy una imagen")
    assert response.status_code == 422
    assert response.json()["detail"] == "No se pudo leer la imagen."


def test_invalid_device_jwk_is_422(client, jpeg_bytes, pipeline):
    files = {
        "selfie": ("s.jpg", jpeg_bytes, "image/jpeg"),
        "document": ("d.jpg", jpeg_bytes, "image/jpeg"),
    }
    response = client.post("/ingest", data={"device_public_jwk": "{no-json"}, files=files)
    assert response.status_code == 422


def test_mrz_failure_is_422_with_message(client, jpeg_bytes, pipeline):
    pipeline["document"] = ValueError("Los dígitos de control de la MRZ no coinciden.")
    response = post_ingest(client, jpeg_bytes)
    assert response.status_code == 422
    assert response.json()["detail"] == "Los dígitos de control de la MRZ no coinciden."


def test_face_mismatch_is_422(client, jpeg_bytes, pipeline):
    pipeline["faces_match"] = False
    response = post_ingest(client, jpeg_bytes)
    assert response.status_code == 422
    assert "selfie" in response.json()["detail"].lower()


@pytest.mark.parametrize(
    "deepface_error",
    ["Face could not be detected in numpy array.", "Exception while processing img1_path"],
)
def test_no_face_detected_is_translated_422(client, jpeg_bytes, pipeline, deepface_error):
    pipeline["faces_match"] = ValueError(deepface_error)
    response = post_ingest(client, jpeg_bytes)
    assert response.status_code == 422
    assert response.json()["detail"] == NO_FACE_DETAIL


def test_no_face_in_embedding_is_translated_422(client, jpeg_bytes, pipeline, monkeypatch):
    def no_face(_selfie):
        raise ValueError("Face could not be detected.")

    monkeypatch.setattr(face, "embed_face", no_face)
    response = post_ingest(client, jpeg_bytes)
    assert response.status_code == 422
    assert response.json()["detail"] == NO_FACE_DETAIL


@pytest.mark.parametrize("duplicate", ["document_exists", "face_exists"])
def test_duplicate_person_is_409(client, jpeg_bytes, pipeline, duplicate):
    pipeline[duplicate] = True
    response = post_ingest(client, jpeg_bytes)
    assert response.status_code == 409
    assert pipeline["saved"] == []


def test_same_face_and_same_passport_is_already_registered(client, jpeg_bytes, pipeline):
    pipeline["document_exists"] = True
    pipeline["face_exists"] = True
    response = post_ingest(client, jpeg_bytes)
    assert response.status_code == 409
    assert response.json()["detail"] == DUPLICATE_DETAIL
    assert pipeline["saved"] == []


def test_insert_race_is_409(client, jpeg_bytes, pipeline):
    pipeline["save_error"] = psycopg.errors.UniqueViolation("duplicate key")
    assert post_ingest(client, jpeg_bytes).status_code == 409


def test_missing_files_is_422_with_pydantic_detail(client, pipeline):
    response = client.post("/ingest", data={"device_public_jwk": "{}"})
    assert response.status_code == 422
    assert isinstance(response.json()["detail"], list)


def test_ingest_endpoint_is_sync():
    import inspect

    from app.api.ingest import ingest

    assert not inspect.iscoroutinefunction(ingest)
