import pytest

from app.core.config import settings
from app.services import passport
from app.services.passport import GeminiReading

LINE1 = "P<CHLPEREZ<SOTO<<JUAN".ljust(44, "<")
LINE2 = "AB12345671CHL9003152M3501014<<<<<<<<<<<<<<02"


def reading(**overrides):
    fields = {
        "valid": True,
        "error_message": "",
        "document_id": "CHLAB1234567",
        "birth_date": "1990-03-15",
        "nationality": "CL",
        "mrz_line1": LINE1,
        "mrz_line2": LINE2,
    }
    fields.update(overrides)
    return GeminiReading(**fields)


@pytest.fixture
def debug_on(monkeypatch):
    monkeypatch.setattr(settings, "debug_passport", True)


def post_debug(client, jpeg):
    return client.post("/debug/document", files={"document": ("p.jpg", jpeg, "image/jpeg")})


def test_debug_endpoint_is_hidden_when_flag_is_off(client, jpeg_bytes, monkeypatch):
    monkeypatch.setattr(settings, "debug_passport", False)
    assert post_debug(client, jpeg_bytes).status_code == 404


def test_reports_gemini_answer_and_parsed_data(client, jpeg_bytes, debug_on, monkeypatch):
    monkeypatch.setattr(passport, "ask_gemini", lambda _bytes: reading())
    body = post_debug(client, jpeg_bytes).json()
    assert body["image_size"] == "64x64"
    assert body["gemini"]["mrz_line2"] == LINE2
    assert body["parsed"]["document_id"] == "CHL-AB1234567"


def test_reports_parse_error_instead_of_rejecting(client, jpeg_bytes, debug_on, monkeypatch):
    forged = reading(mrz_line2=LINE2.replace("9003152", "8003152"))
    monkeypatch.setattr(passport, "ask_gemini", lambda _bytes: forged)
    response = post_debug(client, jpeg_bytes)
    assert response.status_code == 200
    assert "control" in response.json()["parse_error"]


def test_gemini_outage_is_503(client, jpeg_bytes, debug_on, monkeypatch):
    def unavailable(_bytes):
        raise passport.ReaderUnavailableError("no disponible")

    monkeypatch.setattr(passport, "ask_gemini", unavailable)
    assert post_debug(client, jpeg_bytes).status_code == 503
