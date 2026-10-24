import re
from dataclasses import dataclass
from datetime import date
from functools import lru_cache
from typing import List, Optional

import numpy as np

from app.services.hashing import normalize_rut

RUT_PATTERN = re.compile(r"\b(\d{1,2}\.?\d{3}\.?\d{3}-[\dkK])\b")
# Venezuelan cédula: "V-12.345.678", "V 12345678", "E-81.234.567" (E = foreign resident).
VE_ID_PATTERN = re.compile(r"\b([VE])\s*[-.]?\s*(\d{1,3}(?:\.?\d{3}){1,2})\b")
TEXT_DATE_PATTERN = re.compile(r"\b(\d{1,2})\s*([A-Z]{3})\s*(\d{4})\b")
NUMERIC_DATE_PATTERN = re.compile(r"\b(\d{1,2})\s*[/.-]\s*(\d{1,2})\s*[/.-]\s*(\d{4})\b")
MONTHS = {
    "ENE": 1, "FEB": 2, "MAR": 3, "ABR": 4, "MAY": 5, "JUN": 6,
    "JUL": 7, "AGO": 8, "SEP": 9, "OCT": 10, "NOV": 11, "DIC": 12,
}
NATIONALITIES = {
    "CHILENA": "CL", "CHILENO": "CL", "CHL": "CL",
    "VENEZOLANA": "VE", "VENEZOLANO": "VE",
}


@dataclass
class DocumentData:
    # Normalized and country-scoped so ids from different countries never collide.
    document_id: str
    birth_date: date
    nationality: Optional[str]


@lru_cache
def _reader():
    import easyocr

    return easyocr.Reader(["es"], gpu=False)


def _valid_date(year: int, month: int, day: int) -> Optional[date]:
    try:
        parsed = date(year, month, day)
    except ValueError:
        return None
    return parsed if 1900 <= parsed.year <= date.today().year else None


def _parse_dates(text: str) -> List[date]:
    candidates = [
        _valid_date(int(year), MONTHS[month], int(day))
        for day, month, year in TEXT_DATE_PATTERN.findall(text)
        if month in MONTHS
    ]
    candidates += [
        _valid_date(int(year), int(month), int(day))
        for day, month, year in NUMERIC_DATE_PATTERN.findall(text)
    ]
    return [parsed for parsed in candidates if parsed]


def _nationality_from_text(text: str) -> Optional[str]:
    return next((code for word, code in NATIONALITIES.items() if word in text), None)


def _find_document(text: str):
    rut_match = RUT_PATTERN.search(text)
    if rut_match:
        return normalize_rut(rut_match.group(1)), _nationality_from_text(text)

    for prefix, number in VE_ID_PATTERN.findall(text):
        digits = number.replace(".", "")
        if 6 <= len(digits) <= 9:
            nationality = "VE" if prefix == "V" else None
            return f"VE-{prefix}{int(digits)}", nationality

    raise ValueError("No se encontró el número de documento (RUT o cédula) en el carnet.")


def parse_document_text(text: str) -> DocumentData:
    text = text.upper()
    document_id, nationality = _find_document(text)

    dates = _parse_dates(text)
    if not dates:
        raise ValueError("No se encontró la fecha de nacimiento en el carnet.")

    # The birth date is always the oldest date printed on the card.
    return DocumentData(document_id=document_id, birth_date=min(dates), nationality=nationality)


def read_document(image: np.ndarray) -> DocumentData:
    lines = _reader().readtext(image, detail=0, paragraph=False)
    return parse_document_text(" ".join(lines))
