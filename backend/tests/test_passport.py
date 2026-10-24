from datetime import date

import pytest
from passporteye.mrz.text import MRZ

from app.services.passport import _nationality, parse_mrz

LINE1 = "P<CHLPEREZ<SOTO<<JUAN".ljust(44, "<")
LINE2 = "AB12345671CHL9003152M3501014<<<<<<<<<<<<<<02"


def test_parses_valid_passport():
    data = parse_mrz(MRZ([LINE1, LINE2]))
    assert data.document_id == "CHL-AB1234567"
    assert data.birth_date == date(1990, 3, 15)
    assert data.nationality == "CL"


@pytest.mark.parametrize(
    ("icao", "iso"),
    [("CHL", "CL"), ("JPN", "JP"), ("D<<", "DE"), ("GBN", "GB"), ("XXA", None)],
)
def test_nationality_covers_any_icao_code(icao, iso):
    assert _nationality(icao) == iso


def test_tampered_birth_date_fails_checksum():
    forged = LINE2.replace("9003152", "8003152")
    with pytest.raises(ValueError, match="control"):
        parse_mrz(MRZ([LINE1, forged]))


def test_expired_passport_is_still_read():
    icao_specimen = MRZ([
        "P<UTOERIKSSON<<ANNA<MARIA".ljust(44, "<"),
        "L898902C36UTO7408122F1204159ZE184226B<<<<<10",
    ])
    data = parse_mrz(icao_specimen)
    assert data.document_id == "UTO-L898902C3"
    assert data.birth_date == date(1974, 8, 12)
