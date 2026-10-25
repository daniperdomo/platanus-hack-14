import json
import logging
import uuid
import urllib.error
import urllib.request
from typing import Any, Dict

from app.db import database

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"
TIMEOUT_SECONDS = 5

logger = logging.getLogger(__name__)


def notify_credential(credential_id: str, title: str, body: str, data: Dict[str, Any]) -> None:
    """Best effort: the phone also polls its inbox, so a failed push only delays the prompt."""
    tokens = database.list_push_tokens(uuid.UUID(credential_id))
    if not tokens:
        return
    messages = [
        {"to": token, "title": title, "body": body, "data": data, "sound": "default", "priority": "high"}
        for token in tokens
    ]
    request = urllib.request.Request(
        EXPO_PUSH_URL,
        data=json.dumps(messages).encode(),
        headers={"Content-Type": "application/json", "Accept": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=TIMEOUT_SECONDS) as response:
            response.read()
    except (urllib.error.URLError, TimeoutError) as error:
        logger.warning("No se pudo enviar la notificación push: %s", error)
