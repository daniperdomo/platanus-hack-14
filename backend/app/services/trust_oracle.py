import asyncio
import json
import logging
from functools import lru_cache

from google import genai

from app.core.config import settings
from app.schemas.trust import TrustEvaluation

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = (
    "Eres el Auditor Legal de ZeroID. Evalúa esta política de privacidad y genera un JSON estricto. "
    "Criterios y pesos: Seguridad (25%), Minimización (20%), Transparencia (20%), "
    "Derechos del usuario (15%), Retención (10%), Terceros (10%). "
    "Asigna un score de 0-100 a cada uno y una breve justificación. "
    "Calcula el scoreTotal ponderado y asigna el grade (A: 90-100, B: 70-89, C: 50-69, D: <50)."
)

ORACLE_UNAVAILABLE_DETAIL = (
    "El auditor de políticas no está disponible. Inténtalo de nuevo en unos segundos."
)
INVALID_EVALUATION_DETAIL = "El auditor de políticas devolvió una evaluación inválida."
TRUST_FLASH_MODEL = "gemini-flash-lite-latest"


class OracleUnavailableError(Exception):
    """Gemini could not be reached; not the caller's fault."""


class InvalidEvaluationError(Exception):
    """Gemini returned a payload that is not a JSON object."""


@lru_cache
def _client() -> genai.Client:
    return genai.Client(api_key=settings.gemini_api_key)


def _generate(text: str) -> str:
    response = _client().models.generate_content(
        model=TRUST_FLASH_MODEL,
        contents=text,
        config={
            "system_instruction": SYSTEM_PROMPT,
            "response_mime_type": "application/json",
            "response_schema": TrustEvaluation,
        },
    )
    return response.text


async def evaluate_policy(text: str) -> dict:
    try:
        output_text = await asyncio.wait_for(asyncio.to_thread(_generate, text), timeout=90)
    except Exception as error:
        logger.exception("Gemini trust evaluation failed")
        raise OracleUnavailableError(ORACLE_UNAVAILABLE_DETAIL) from error

    try:
        payload = json.loads(output_text)
    except (TypeError, json.JSONDecodeError) as error:
        logger.exception("Gemini trust evaluation was not valid JSON")
        raise InvalidEvaluationError(INVALID_EVALUATION_DETAIL) from error

    if not isinstance(payload, dict):
        raise InvalidEvaluationError(INVALID_EVALUATION_DETAIL)
    return payload
