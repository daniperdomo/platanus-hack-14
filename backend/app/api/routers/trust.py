from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, HttpUrl, ValidationError

from app.schemas.trust import TrustEvaluation
from app.services.scraper import PolicyFetchError, extract_policy_text
from app.services.trust_oracle import (
    INVALID_EVALUATION_DETAIL,
    InvalidEvaluationError,
    OracleUnavailableError,
    evaluate_policy,
)

router = APIRouter(prefix="/trust")


class AnalyzeRequest(BaseModel):
    url: HttpUrl


@router.post("/analyze", response_model=TrustEvaluation)
async def analyze(payload: AnalyzeRequest) -> TrustEvaluation:
    try:
        policy_text = await extract_policy_text(str(payload.url))
    except PolicyFetchError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

    try:
        evaluation = await evaluate_policy(policy_text)
        return TrustEvaluation.model_validate(evaluation)
    except OracleUnavailableError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    except (InvalidEvaluationError, ValidationError) as error:
        detail = str(error) if isinstance(error, InvalidEvaluationError) else INVALID_EVALUATION_DETAIL
        raise HTTPException(status_code=502, detail=detail) from error
