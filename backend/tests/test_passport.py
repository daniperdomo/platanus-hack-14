import base64
import json
from datetime import date
from types import SimpleNamespace

import pytest

from app.core.config import settings
from app.services import passport
from app.services.passport import (
    CHECKSUM_DETAIL,
    NOT_A_PASSPORT_DETAIL,
    UNREADABLE_DETAIL,
    ReaderUnavailableError,
    _nationality,
    read_passport,
)

LINE1 = "P<CHLPEREZ<SOTO<<JUAN".ljust(44, "<")
LINE2 = "AB12345671CHL9003152M3501014<<<<<<<<<<<<<<02"
IMAGE = b"\xff\xd8fake-jpeg"


def gemini_json(**overrides):
    reading = {
        "valid": True,
        "error_message": "",
        "document_id": "CHLAB1234567",
        "birth_date": "1990-03-15",
        "nationality": "CL",
        "mrz_line1": LINE1,
        "mrz_line2": LINE2,
    }
    reading.update(overrides)
    return json.dumps(reading)


class FakeInteractions:
    def __init__(self):
        self.response = gemini_json()
        self.calls = []

    def create(self, **kwargs):
        self.calls.append(kwargs)
        if isinstance(self.response, Exception):
            raise self.response
        return SimpleNamespace(output_text=self.response)


@pytest.fixture
def gemini(monkeypatch):
    """Stand-in for the Gemini client: no network, no quota."""
    interactions = FakeInteractions()
    monkeypatch.setattr(passport, "_client", lambda: SimpleNamespace(interactions=interactions))
    return interactions


def test_valid_passport_is_read_from_the_verified_mrz(gemini):
    data = read_passport(IMAGE)
    assert data.document_id == "CHL-AB1234567"
    assert data.birth_date == date(1990, 3, 15)
    assert data.nationality == "CL"
    assert data.holder_name == "JUAN PEREZ SOTO"


def test_request_sends_inline_jpeg_and_is_not_stored(gemini):
    read_passport(IMAGE)
    [call] = gemini.calls
    image = call["input"][1]
    assert image["mime_type"] == "image/jpeg"
    assert base64.b64decode(image["data"]) == IMAGE
    assert call["store"] is False
    assert call["model"] == settings.gemini_model
    assert call["response_format"]["mime_type"] == "application/json"


def test_model_rejection_is_raised_with_its_message(gemini):
    gemini.response = gemini_json(valid=False, error_message="La foto está borrosa.")
    with pytest.raises(ValueError, match="La foto está borrosa."):
        read_passport(IMAGE)


def test_checksums_are_verified_locally_even_if_the_model_says_valid(gemini):
    gemini.response = gemini_json(mrz_line2=LINE2.replace("9003152", "8003152"))
    with pytest.raises(ValueError, match=CHECKSUM_DETAIL):
        read_passport(IMAGE)


def test_non_passport_mrz_is_rejected(gemini):
    gemini.response = gemini_json(mrz_line1="I" + LINE1[1:])
    with pytest.raises(ValueError, match=NOT_A_PASSPORT_DETAIL):
        read_passport(IMAGE)


def test_truncated_mrz_line_is_rejected(gemini):
    gemini.response = gemini_json(mrz_line2=LINE2[:40])
    with pytest.raises(ValueError, match=NOT_A_PASSPORT_DETAIL):
        read_passport(IMAGE)


def test_spaces_in_the_transcription_are_ignored(gemini):
    gemini.response = gemini_json(mrz_line2=f"{LINE2[:22]} {LINE2[22:]}")
    assert read_passport(IMAGE).document_id == "CHL-AB1234567"


def test_malformed_model_output_is_unreadable(gemini):
    gemini.response = "esto no es json"
    with pytest.raises(ValueError, match=UNREADABLE_DETAIL):
        read_passport(IMAGE)


def test_api_failure_is_reported_as_unavailable(gemini):
    gemini.response = RuntimeError("429 quota exceeded")
    with pytest.raises(ReaderUnavailableError):
        read_passport(IMAGE)


def test_expired_passport_is_still_read(gemini):
    gemini.response = gemini_json(
        mrz_line1="P<UTOERIKSSON<<ANNA<MARIA".ljust(44, "<"),
        mrz_line2="L898902C36UTO7408122F1204159ZE184226B<<<<<10",
    )
    data = read_passport(IMAGE)
    assert data.document_id == "UTO-L898902C3"
    assert data.birth_date == date(1974, 8, 12)


@pytest.mark.parametrize(
    ("icao", "iso"),
    [("CHL", "CL"), ("JPN", "JP"), ("D<<", "DE"), ("GBN", "GB"), ("XXA", None)],
)
def test_nationality_covers_any_icao_code(icao, iso):
    assert _nationality(icao) == iso
