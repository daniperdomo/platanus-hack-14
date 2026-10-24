from datetime import date

import pytest

from app.services.ocr import parse_document_text

CEDULA_CL = (
    "REPUBLICA DE CHILE CEDULA DE IDENTIDAD APELLIDOS PEREZ SOTO NOMBRES JUAN "
    "NACIONALIDAD CHILENA SEXO M FECHA DE NACIMIENTO 15 MAR 1990 "
    "NUMERO DOCUMENTO 123.456.789 FECHA DE EMISION 10 ENE 2020 "
    "FECHA DE VENCIMIENTO 10 ENE 2030 RUN 12.345.678-5"
)


def test_parses_chilean_id_card():
    data = parse_document_text(CEDULA_CL)
    assert data.rut == "12.345.678-5"
    assert data.birth_date == date(1990, 3, 15)
    assert data.nationality == "CL"


def test_birth_date_is_the_oldest_date():
    data = parse_document_text(CEDULA_CL)
    assert data.birth_date.year == 1990


def test_ocr_text_is_case_insensitive():
    data = parse_document_text(CEDULA_CL.lower())
    assert data.rut == "12.345.678-5"
    assert data.birth_date == date(1990, 3, 15)


def test_rut_with_k_verifier():
    data = parse_document_text("RUN 9.876.543-K NACIMIENTO 01 DIC 2001")
    assert data.rut == "9.876.543-K"


def test_unknown_nationality_is_none():
    data = parse_document_text("RUN 12.345.678-5 NACIMIENTO 15 MAR 1990 NACIONALIDAD VENEZOLANA")
    assert data.nationality is None


def test_invalid_calendar_dates_are_skipped():
    data = parse_document_text("RUN 12.345.678-5 31 FEB 1980 15 MAR 1990")
    assert data.birth_date == date(1990, 3, 15)


def test_missing_rut_raises():
    with pytest.raises(ValueError, match="RUT"):
        parse_document_text("PASSPORT NUMBER X1234567 15 MAR 1990")


def test_missing_birth_date_raises():
    with pytest.raises(ValueError, match="fecha de nacimiento"):
        parse_document_text("RUN 12.345.678-5 NACIONALIDAD CHILENA")
