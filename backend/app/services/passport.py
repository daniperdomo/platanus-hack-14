import io
from dataclasses import dataclass
from datetime import date
from typing import Optional

import pycountry
from passporteye import read_mrz

# ICAO 9303 codes that are not ISO 3166 alpha-3 (Germany, British nationality variants).
ICAO_EXCEPTIONS = {"D": "DE", "GBD": "GB", "GBN": "GB", "GBO": "GB", "GBP": "GB", "GBS": "GB"}


@dataclass
class PassportData:
    # Issuing state + passport number, so numbers from different countries never collide.
    document_id: str
    birth_date: date
    nationality: Optional[str]


def _clean(field: str) -> str:
    return field.replace("<", "").strip().upper()


def _mrz_date(yymmdd: str, century: int) -> date:
    try:
        return date(century + int(yymmdd[:2]), int(yymmdd[2:4]), int(yymmdd[4:6]))
    except ValueError:
        raise ValueError("La MRZ del pasaporte tiene una fecha ilegible.")


def _nationality(icao_code: str) -> Optional[str]:
    code = _clean(icao_code)
    if code in ICAO_EXCEPTIONS:
        return ICAO_EXCEPTIONS[code]
    country = pycountry.countries.get(alpha_3=code)
    return country.alpha_2 if country else None


def _birth_date(yymmdd: str) -> date:
    # MRZ years have two digits; a birth date can never be in the future.
    born = _mrz_date(yymmdd, 2000)
    return born if born <= date.today() else _mrz_date(yymmdd, 1900)


def parse_mrz(mrz) -> PassportData:
    if mrz.mrz_type != "TD3":
        raise ValueError("Solo aceptamos pasaportes. Fotografía la página de datos del pasaporte.")
    if not mrz.valid:
        raise ValueError(
            "Los dígitos de control de la MRZ no coinciden. Vuelve a fotografiar el pasaporte."
        )

    return PassportData(
        document_id=f"{_clean(mrz.country)}-{_clean(mrz.number)}",
        birth_date=_birth_date(mrz.date_of_birth),
        nationality=_nationality(mrz.nationality),
    )


def read_passport(image_bytes: bytes) -> PassportData:
    mrz = read_mrz(io.BytesIO(image_bytes))
    if mrz is None:
        raise ValueError(
            "No encontramos la zona MRZ del pasaporte. Fotografía la página de datos completa, "
            "con buena luz y sin reflejos."
        )
    return parse_mrz(mrz)
