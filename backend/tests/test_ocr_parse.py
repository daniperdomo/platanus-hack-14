from datetime import date

import pytest

from app.services.ocr import parse_document_text

CEDULA_CL = (
    "REPUBLICA DE CHILE CEDULA DE IDENTIDAD APELLIDOS PEREZ SOTO NOMBRES JUAN "
    "NACIONALIDAD CHILENA SEXO M FECHA DE NACIMIENTO 15 MAR 1990 "
    "NUMERO DOCUMENTO 123.456.789 FECHA DE EMISION 10 ENE 2020 "
    "FECHA DE VENCIMIENTO 10 ENE 2030 RUN 12.345.678-5"
)

CEDULA_VE = (
    "REPUBLICA BOLIVARIANA DE VENEZUELA CEDULA DE IDENTIDAD V 12.345.678 "
    "APELLIDOS PEREZ GOMEZ NOMBRES MARIA F. NACIMIENTO 15/03/1990 "
    "EDO. CIVIL SOLTERA F. EXPEDICION 10/2021 F. VENCIMIENTO 10/2031 VENEZOLANA"
)


def test_parses_chilean_id_card():
    data = parse_document_text(CEDULA_CL)
    assert data.document_id == "123456785"
    assert data.birth_date == date(1990, 3, 15)
    assert data.nationality == "CL"


def test_chilean_rut_in_any_format_gives_same_id():
    dotted = parse_document_text("RUN 12.345.678-5 15 MAR 1990").document_id
    plain = parse_document_text("RUN 12345678-5 15 MAR 1990").document_id
    assert dotted == plain


def test_ocr_text_is_case_insensitive():
    data = parse_document_text(CEDULA_CL.lower())
    assert data.document_id == "123456785"
    assert data.birth_date == date(1990, 3, 15)


def test_rut_with_k_verifier():
    assert parse_document_text("RUN 9.876.543-K 01 DIC 2001").document_id == "9876543K"


def test_parses_venezuelan_id_card():
    data = parse_document_text(CEDULA_VE)
    assert data.document_id == "VE-V12345678"
    assert data.birth_date == date(1990, 3, 15)
    assert data.nationality == "VE"


@pytest.mark.parametrize(
    "number",
    ["V-12.345.678", "V 12345678", "V12.345.678", "V.12.345.678", "v-12.345.678"],
)
def test_venezuelan_number_formats(number):
    assert parse_document_text(f"{number} 15/03/1990").document_id == "VE-V12345678"


def test_venezuelan_seven_digit_cedula():
    assert parse_document_text("V-9.876.543 01-12-1965").document_id == "VE-V9876543"


def test_foreign_resident_prefix_e_is_not_venezuelan():
    data = parse_document_text("REPUBLICA BOLIVARIANA DE VENEZUELA E-81.234.567 15/03/1990")
    assert data.document_id == "VE-E81234567"
    assert data.nationality is None


def test_venezuelan_month_year_dates_are_not_birth_dates():
    data = parse_document_text("V 12.345.678 15/03/1990 10/2021 10/2031")
    assert data.birth_date == date(1990, 3, 15)


def test_birth_date_is_the_oldest_date():
    assert parse_document_text(CEDULA_CL).birth_date.year == 1990


def test_unknown_nationality_is_none():
    data = parse_document_text("RUN 12.345.678-5 15 MAR 1990 NACIONALIDAD PERUANA")
    assert data.nationality is None


def test_invalid_calendar_dates_are_skipped():
    data = parse_document_text("RUN 12.345.678-5 31 FEB 1980 15 MAR 1990")
    assert data.birth_date == date(1990, 3, 15)


def test_future_dates_are_not_birth_dates():
    data = parse_document_text("V 12.345.678 15/03/1990 01/01/2099")
    assert data.birth_date == date(1990, 3, 15)


def test_missing_document_number_raises():
    with pytest.raises(ValueError, match="número de documento"):
        parse_document_text("PASSPORT NUMBER X1234567 15 MAR 1990")


def test_missing_birth_date_raises():
    with pytest.raises(ValueError, match="fecha de nacimiento"):
        parse_document_text("RUN 12.345.678-5 NACIONALIDAD CHILENA")
