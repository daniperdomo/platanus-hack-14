import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter, BackgroundTasks, status
from pydantic import BaseModel, Field, HttpUrl

from app.schemas.trust import TrustEvaluation
from app.services.advanced_scraper import extract_policy_text
from app.services.trust_oracle import evaluate_policy

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/trust")

# Mirror of the demo catalog until a Trust table exists.
REGISTERED_POLICIES = (
    ("google", "https://policies.google.com/privacy"),
    ("apple", "https://www.apple.com/legal/privacy/"),
    ("microsoft", "https://privacy.microsoft.com/privacystatement"),
    ("spotify", "https://www.spotify.com/legal/privacy-policy/"),
    ("netflix", "https://help.netflix.com/legal/privacy"),
    ("uber", "https://privacy.uber.com/policy"),
    ("airbnb", "https://www.airbnb.com/help/article/2855"),
    ("paypal", "https://www.paypal.com/legalhub/privacy-full"),
    ("amazon", "https://www.amazon.com/privacy"),
    ("meta", "https://www.facebook.com/privacy/policy/?locale=en_US"),
    ("tiktok", "https://www.tiktok.com/legal/page/us/privacy-policy/en"),
    ("x", "https://x.com/en/privacy"),
    ("mercadolibre", "https://www.mercadolibre.cl/privacidad"),
)

_evaluations: dict[str, dict] = {}


class QueueRequest(BaseModel):
    url: HttpUrl
    company_id: str = Field(min_length=1)


class QueueAccepted(BaseModel):
    status: Literal["processing"]
    company_id: str


def persist_evaluation(company_id: str, url: str, evaluation: dict) -> None:
    record = {
        "company_id": company_id,
        "url": url,
        "evaluation": evaluation,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    _evaluations[company_id] = record
    serialized = json.dumps(record, ensure_ascii=False)
    logger.info("Trust evaluation upsert (DB Trust no lista, simulado): %s", serialized)
    print(f"[trust-store] upsert company_id={company_id} {serialized}", flush=True)


async def process_trust_job(url: str, company_id: str) -> None:
    logger.info("Trust job started company_id=%s url=%s", company_id, url)
    try:
        policy_text = await extract_policy_text(url)
        evaluation = await evaluate_policy(policy_text)
        validated = TrustEvaluation.model_validate(evaluation)
        persist_evaluation(company_id, url, validated.model_dump())
    except Exception:
        logger.exception("Trust job failed company_id=%s url=%s", company_id, url)


def enqueue_continuous_audit(loop: asyncio.AbstractEventLoop) -> None:
    logger.info("Continuous trust audit tick: %s registered policies", len(REGISTERED_POLICIES))
    for company_id, url in REGISTERED_POLICIES:
        asyncio.run_coroutine_threadsafe(process_trust_job(url, company_id), loop)


@router.post("/queue", response_model=QueueAccepted, status_code=status.HTTP_202_ACCEPTED)
async def queue_analysis(payload: QueueRequest, background_tasks: BackgroundTasks) -> QueueAccepted:
    background_tasks.add_task(process_trust_job, str(payload.url), payload.company_id)
    return QueueAccepted(status="processing", company_id=payload.company_id)
