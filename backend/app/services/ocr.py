import re
from dataclasses import dataclass
from datetime import date
from functools import lru_cache
from typing import List, Optional

import numpy as np

RUT_PATTERN = re.compile(r"\b(\d{1,2}\.?\d{3}\.?\d{3}-[\dkK])\b")
DATE_PATTERN = re.compile(r"\b(\d{1,2})\s*([A-Z]{3})\s*(\d{4})\b")
MONTHS = {
    "ENE": 1, "FEB": 2, "MAR": 3, "ABR": 4, "MAY": 5, "JUN": 6,
    "JUL": 7, "AGO": 8, "SEP": 9, "OCT": 10, "NOV": 11, "DIC": 12,
}
NATIONALITIES = {"CHILENA": "CL", "CHILENO": "CL", "CHL": "CL"}


@dataclass
class DocumentData:
    rut: str
    birth_date: date
    nationality: Optional[str]


@lru_cache
def _reader():
    import easyocr

    return easyocr.Reader(["es"], gpu=False)


def _parse_dates(text: str) -> List[date]:
    dates = []
    for day, month, year in DATE_PATTERN.findall(text):
        if month not in MONTHS:
            continue
        try:
            dates.append(date(int(year), MONTHS[month], int(day)))
        except ValueError:
            continue
    return dates


def parse_document_text(text: str) -> DocumentData:
    text = text.upper()

    rut_match = RUT_PATTERN.search(text)
    if not rut_match:
        raise ValueError("No se encontró el RUT en el carnet.")

    dates = _parse_dates(text)
    if not dates:
        raise ValueError("No se encontró la fecha de nacimiento en el carnet.")

    nationality = next(
        (code for word, code in NATIONALITIES.items() if word in text), None
    )

    # The birth date is always the oldest date printed on the card.
    return DocumentData(rut=rut_match.group(1), birth_date=min(dates), nationality=nationality)


def read_document(image: np.ndarray) -> DocumentData:
    lines = _reader().readtext(image, detail=0, paragraph=False)
    return parse_document_text(" ".join(lines))
