import logging

import httpx
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)
POLICY_HEADERS = {
    "User-Agent": USER_AGENT,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "es-CL,es;q=0.9,en;q=0.8",
}
MAX_POLICY_CHARS = 15_000
BLOCKED_DETAIL = "No pudimos leer la política de privacidad: la URL bloqueó la petición."


class PolicyFetchError(Exception):
    """The policy URL refused the request or returned no usable text."""


async def extract_policy_text(url: str) -> str:
    try:
        async with httpx.AsyncClient(headers=POLICY_HEADERS, follow_redirects=True, timeout=30.0) as client:
            response = await client.get(url)
    except httpx.HTTPError as error:
        logger.info("Policy scrape failed for %s: %s", url, error)
        raise PolicyFetchError(BLOCKED_DETAIL) from error

    if response.status_code >= 400:
        logger.info("Policy scrape blocked for %s: HTTP %s", url, response.status_code)
        raise PolicyFetchError(BLOCKED_DETAIL)

    soup = BeautifulSoup(response.text, "html.parser")
    text = soup.get_text(separator=" ", strip=True)
    if not text:
        raise PolicyFetchError(BLOCKED_DETAIL)
    return text[:MAX_POLICY_CHARS]
