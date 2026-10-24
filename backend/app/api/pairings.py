import uuid

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.db import database

router = APIRouter()

PAIRING_TTL_SECONDS = 300
NOT_FOUND_DETAIL = "El emparejamiento no existe, expiró o ya se usó."


class PairingIn(BaseModel):
    payload: str = Field(min_length=1, max_length=20000)


class PairingCreated(BaseModel):
    pairing_id: str
    expires_in: int


class PairingClaimed(BaseModel):
    payload: str


@router.post("/pairings", response_model=PairingCreated)
def create_pairing(body: PairingIn):
    pairing_id = database.create_pairing(body.payload, PAIRING_TTL_SECONDS)
    return PairingCreated(pairing_id=pairing_id, expires_in=PAIRING_TTL_SECONDS)


@router.post("/pairings/{pairing_id}/claim", response_model=PairingClaimed)
def claim_pairing(pairing_id: str):
    try:
        parsed = uuid.UUID(pairing_id)
    except ValueError:
        raise HTTPException(status_code=404, detail=NOT_FOUND_DETAIL)
    payload = database.claim_pairing(parsed)
    if payload is None:
        raise HTTPException(status_code=410, detail=NOT_FOUND_DETAIL)
    return PairingClaimed(payload=payload)
