import logging
import re
from itertools import cycle
from threading import Lock

import httpx
from bs4 import BeautifulSoup

from app.services.scraper import BLOCKED_DETAIL, MAX_POLICY_CHARS, PolicyFetchError

logger = logging.getLogger(__name__)

USER_AGENTS = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/131.0.6778.86 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/131.0.6778.86 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_7_1) AppleWebKit/605.1.15 "
    "(KHTML, like Gecko) Version/18.1.1 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/131.0.6778.86 Safari/537.36",
)
POLICY_KEYWORDS = (
    "terceros",
    "compartir",
    "retención",
    "retencion",
    "seguridad",
    "cifrado",
    "derechos",
    "borrar",
    "third part",
    "share",
    "sharing",
    "retention",
    "security",
    "encrypt",
    "rights",
    "delete",
)
MIN_FILTERED_CHARS = 500

_user_agents = cycle(USER_AGENTS)
_user_agent_lock = Lock()


def _next_user_agent() -> str:
    with _user_agent_lock:
        return next(_user_agents)


def _headers() -> dict[str, str]:
    return {
        "User-Agent": _next_user_agent(),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "es-CL,es;q=0.9,en;q=0.8",
    }


def split_paragraphs(text: str) -> list[str]:
    chunks = [chunk.strip() for chunk in re.split(r"\n{2,}", text) if chunk.strip()]
    if len(chunks) <= 1:
        chunks = [line.strip() for line in text.splitlines() if line.strip()]
    return chunks


def select_relevant_text(text: str) -> str:
    matches = [
        paragraph
        for paragraph in split_paragraphs(text)
        if any(keyword in paragraph.lower() for keyword in POLICY_KEYWORDS)
    ]
    filtered = "\n\n".join(matches)
    if len(filtered) < MIN_FILTERED_CHARS:
        logger.info(
            "Semantic filter fallback to first %s chars (%s matching chars)",
            MAX_POLICY_CHARS,
            len(filtered),
        )
        return text[:MAX_POLICY_CHARS]
    return filtered[:MAX_POLICY_CHARS]


def _visible_text(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "noscript", "svg"]):
        tag.decompose()
    return soup.get_text(separator="\n", strip=True)


async def extract_policy_text(url: str) -> str:
    try:
        async with httpx.AsyncClient(headers=_headers(), follow_redirects=True, timeout=30.0) as client:
            response = await client.get(url)
    except httpx.HTTPError as error:
        logger.info("Advanced policy scrape failed for %s: %s", url, error)
        raise PolicyFetchError(BLOCKED_DETAIL) from error

    if response.status_code >= 400:
        logger.info("Advanced policy scrape blocked for %s: HTTP %s", url, response.status_code)
        raise PolicyFetchError(BLOCKED_DETAIL)

    text = _visible_text(response.text)
    if not text:
        raise PolicyFetchError(BLOCKED_DETAIL)
    return select_relevant_text(text)
