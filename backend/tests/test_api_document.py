from datetime import date

import pytest

from app.api.document import NO_HOLDER_PHOTO_DETAIL
from app.api.ingest import DUPLICATE_DETAIL
from app.core.config import settings
from app.db import database
from app.services import face, passport
from app.services.passport import PassportData

PASSPORT = PassportData(document_id="CHL-AB1234567", birth_date=date(1990, 3, 15), nationality="CL")


@pytest.fixture
def checks(monkeypatch):
    """Replace the MRZ reader, face detector and DB lookup with controllable fakes."""
    state = {"document": PASSPORT, "has_face": True, "document_exists": False}

    def read_passport(_image_bytes):
        if isinstance(state["document"], Exception):
            raise state["document"]
        return state["document"]

    monkeypatch.setattr(settings, "debug_passport", False)
    monkeypatch.setattr(passport, "read_passport", read_passport)
    monkeypatch.setattr(face, "has_face", lambda _image: state["has_face"])
    monkeypatch.setattr(database, "document_exists", lambda _h: state["document_exists"])
    return state


def post_check(client, jpeg):
    return client.post("/document/check", files={"document": ("pasaporte.jpg", jpeg, "image/jpeg")})


def test_valid_passport_is_ok(client, jpeg_bytes, checks):
    response = post_check(client, jpeg_bytes)
    assert response.status_code == 200
    assert response.json() == {"ok": True}


def test_response_carries_no_passport_data(client, jpeg_bytes, checks):
    body = post_check(client, jpeg_bytes).text
    assert "AB1234567" not in body and "1990" not in body


def test_debug_flag_echoes_the_mrz_data(client, jpeg_bytes, checks, monkeypatch):
    monkeypatch.setattr(settings, "debug_passport", True)
    response = post_check(client, jpeg_bytes)
    assert response.json()["debug"] == {
        "document_id": "CHL-AB1234567",
        "birth_date": "1990-03-15",
        "nationality": "CL",
    }


def test_unreadable_image_is_422(client, checks):
    response = post_check(client, b"no soy una imagen")
    assert response.status_code == 422
    assert response.json()["detail"] == "No se pudo leer la imagen."


def test_mrz_failure_is_422_with_message(client, jpeg_bytes, checks):
    checks["document"] = ValueError("Los dígitos de control de la MRZ no coinciden.")
    response = post_check(client, jpeg_bytes)
    assert response.status_code == 422
    assert response.json()["detail"] == "Los dígitos de control de la MRZ no coinciden."


def test_reader_outage_is_503(client, jpeg_bytes, checks):
    checks["document"] = passport.ReaderUnavailableError("El lector no está disponible.")
    response = post_check(client, jpeg_bytes)
    assert response.status_code == 503
    assert response.json()["detail"] == "El lector no está disponible."


def test_passport_without_holder_photo_is_422(client, jpeg_bytes, checks):
    checks["has_face"] = False
    response = post_check(client, jpeg_bytes)
    assert response.status_code == 422
    assert response.json()["detail"] == NO_HOLDER_PHOTO_DETAIL


def test_already_registered_passport_is_409(client, jpeg_bytes, checks):
    checks["document_exists"] = True
    response = post_check(client, jpeg_bytes)
    assert response.status_code == 409
    assert response.json()["detail"] == DUPLICATE_DETAIL


def test_missing_file_is_422(client, checks):
    assert client.post("/document/check").status_code == 422


def test_check_endpoint_is_sync():
    import inspect

    from app.api.document import check_document

    assert not inspect.iscoroutinefunction(check_document)
