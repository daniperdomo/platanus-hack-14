import base64
import logging
import re
from dataclasses import dataclass
from datetime import date
from functools import lru_cache
from typing import Optional

import pycountry
from google import genai
from pydantic import BaseModel, Field, ValidationError

from app.core.config import settings

logger = logging.getLogger(__name__)

# ICAO 9303 codes that are not ISO 3166 alpha-3 (Germany, British nationality variants).
ICAO_EXCEPTIONS = {"D": "DE", "GBD": "GB", "GBN": "GB", "GBO": "GB", "GBP": "GB", "GBS": "GB"}
MRZ_LINE = re.compile(r"^[A-Z0-9<]{44}$")
MRZ_LENGTH = 44
FILLER_RUN = re.compile(r"<+")
CHECK_WEIGHTS = (7, 3, 1)

UNREADABLE_DETAIL = "No pudimos leer el pasaporte. Fotografía la página de datos completa, con buena luz."
NOT_A_PASSPORT_DETAIL = "Solo aceptamos pasaportes. Fotografía la página de datos del pasaporte."
CHECKSUM_DETAIL = "Los dígitos de control de la MRZ no coinciden. Vuelve a fotografiar el pasaporte."

INSTRUCTION = """\
You are an expert validator of ICAO 9303 passports (TD3 format).
You receive one photo that should show the data page of a passport.

1. Decide whether the image shows a real passport data page with its machine readable zone (MRZ):
   two lines of exactly 44 characters at the bottom, using only A-Z, 0-9 and '<'.
2. Transcribe both MRZ lines exactly as printed, character by character. Never fix or invent
   characters; if any character is unreadable, set valid to false.
3. Verify the MRZ check digits (weights 7-3-1) and that the MRZ agrees with the printed fields
   (passport number, birth date, nationality).
4. Set valid to false if the image is not a passport (ID card, visa, screen photo of another
   document), the MRZ is missing, cut off or illegible, or there are signs of tampering.
   Do NOT reject a passport only because it is expired.
5. error_message: empty string when valid; otherwise one short sentence in Spanish, addressed to
   the user, explaining what is wrong and how to retake the photo.
6. document_id: issuing country code followed by the passport number, without '<'.
   birth_date: YYYY-MM-DD. nationality: ISO 3166-1 alpha-2 code.
"""


class ReaderUnavailableError(Exception):
    """The passport reader (Gemini) could not be reached; not the user's fault."""


class GeminiReading(BaseModel):
    valid: bool = Field(description="True only for a legible, untampered passport data page.")
    error_message: str = Field(description="Empty if valid, otherwise the rejection reason in Spanish.")
    document_id: str = Field(description="Issuing country code + passport number.")
    birth_date: str = Field(description="Birth date as YYYY-MM-DD.")
    nationality: str = Field(description="Nationality as ISO 3166-1 alpha-2.")
    mrz_line1: str = Field(description="First MRZ line, exactly 44 characters.")
    mrz_line2: str = Field(description="Second MRZ line, exactly 44 characters.")


@dataclass
class PassportData:
    # Issuing state + passport number, so numbers from different countries never collide.
    document_id: str
    birth_date: date
    nationality: Optional[str]
    # Read from the MRZ so the device can encrypt it. Never persisted.
    holder_name: str = ""


@lru_cache
def _client() -> genai.Client:
    return genai.Client(api_key=settings.gemini_api_key)


def _mime_type(image_bytes: bytes) -> str:
    return "image/png" if image_bytes.startswith(b"\x89PNG") else "image/jpeg"


def ask_gemini(image_bytes: bytes) -> GeminiReading:
    try:
        interaction = _client().interactions.create(
            model=settings.gemini_model,
            system_instruction=INSTRUCTION,
            input=[
                {"type": "text", "text": "Validate this passport data page."},
                {
                    "type": "image",
                    "data": base64.b64encode(image_bytes).decode("ascii"),
                    "mime_type": _mime_type(image_bytes),
                },
            ],
            response_format={
                "type": "text",
                "mime_type": "application/json",
                "schema": GeminiReading.model_json_schema(),
            },
            # By default the Interactions API keeps requests (images included) server-side.
            store=False,
        )
    except Exception as error:
        logger.exception("Gemini passport request failed")
        raise ReaderUnavailableError(
            "El lector de pasaportes no está disponible. Inténtalo de nuevo en unos segundos."
        ) from error

    try:
        return GeminiReading.model_validate_json(interaction.output_text)
    except ValidationError:
        raise ValueError(UNREADABLE_DETAIL)


def _clean(field: str) -> str:
    return field.replace("<", "").strip().upper()


def _check_digit(field: str) -> str:
    total = 0
    for index, char in enumerate(field):
        if char.isdigit():
            value = int(char)
        elif char.isalpha():
            value = ord(char) - ord("A") + 10
        else:
            value = 0
        total += value * CHECK_WEIGHTS[index % 3]
    return str(total % 10)


def _checksums_ok(line2: str) -> bool:
    personal_number = line2[28:42]
    personal_ok = _check_digit(personal_number) == line2[42] or (
        personal_number == "<" * 14 and line2[42] == "<"
    )
    return personal_ok and all(
        _check_digit(field) == digit
        for field, digit in (
            (line2[0:9], line2[9]),
            (line2[13:19], line2[19]),
            (line2[21:27], line2[27]),
            (line2[0:10] + line2[13:20] + line2[21:43], line2[43]),
        )
    )


def _mrz_date(yymmdd: str, century: int) -> date:
    try:
        return date(century + int(yymmdd[:2]), int(yymmdd[2:4]), int(yymmdd[4:6]))
    except ValueError:
        raise ValueError("La MRZ del pasaporte tiene una fecha ilegible.")


def _birth_date(yymmdd: str) -> date:
    # MRZ years have two digits; a birth date can never be in the future.
    born = _mrz_date(yymmdd, 2000)
    return born if born <= date.today() else _mrz_date(yymmdd, 1900)


def _holder_name(line1: str) -> str:
    """TD3 line 1 stores SURNAME<<GIVEN<NAMES after the issuing state."""

    def words(part: str) -> str:
        return " ".join(piece for piece in part.split("<") if piece)

    surname, _, given = line1[5:].rstrip("<").partition("<<")
    return " ".join(part for part in (words(given), words(surname)) if part)


def _nationality(icao_code: str) -> Optional[str]:
    code = _clean(icao_code)
    if code in ICAO_EXCEPTIONS:
        return ICAO_EXCEPTIONS[code]
    country = pycountry.countries.get(alpha_3=code)
    return country.alpha_2 if country else None


def _normalize(line: str) -> str:
    return re.sub(r"\s", "", line).upper().replace("«", "<")


def _fit_fillers(line: str) -> str:
    """Models often miscount a run of '<'. Resize the longest run so the line has 44 chars.

    Safe because line 2 is then checked digit by digit, and line 1 only feeds the name.
    """
    missing = MRZ_LENGTH - len(line)
    runs = list(FILLER_RUN.finditer(line))
    if missing == 0 or not runs:
        return line
    run = max(reversed(runs), key=lambda match: len(match.group()))
    size = len(run.group()) + missing
    if size < 1:
        return line
    return line[: run.start()] + "<" * size + line[run.end() :]


def validate_reading(reading: GeminiReading) -> PassportData:
    if not reading.valid:
        raise ValueError(reading.error_message or UNREADABLE_DETAIL)

    line1 = _fit_fillers(_normalize(reading.mrz_line1))
    line2 = _fit_fillers(_normalize(reading.mrz_line2))
    if not line1.startswith("P"):
        raise ValueError(NOT_A_PASSPORT_DETAIL)
    if not (MRZ_LINE.match(line1) and MRZ_LINE.match(line2)):
        logger.info(
            "MRZ rejected: line lengths %d/%d", len(reading.mrz_line1), len(reading.mrz_line2)
        )
        raise ValueError(UNREADABLE_DETAIL)
    if not _checksums_ok(line2):
        raise ValueError(CHECKSUM_DETAIL)

    return PassportData(
        document_id=f"{_clean(line1[2:5])}-{_clean(line2[0:9])}",
        birth_date=_birth_date(line2[13:19]),
        nationality=_nationality(line2[10:13]),
        holder_name=_holder_name(line1),
    )


def read_passport(image_bytes: bytes) -> PassportData:
    return validate_reading(ask_gemini(image_bytes))
