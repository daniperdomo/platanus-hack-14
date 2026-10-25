from typing import Literal

from pydantic import BaseModel, Field, field_validator


def _as_int(value: object) -> object:
    if isinstance(value, bool):
        return value
    if isinstance(value, float):
        return int(round(value))
    return value


class TrustScores(BaseModel):
    seguridad: int = Field(ge=0, le=100)
    minimizacion: int = Field(ge=0, le=100)
    transparencia: int = Field(ge=0, le=100)
    derechos: int = Field(ge=0, le=100)
    retencion: int = Field(ge=0, le=100)
    terceros: int = Field(ge=0, le=100)

    @field_validator(
        "seguridad",
        "minimizacion",
        "transparencia",
        "derechos",
        "retencion",
        "terceros",
        mode="before",
    )
    @classmethod
    def coerce_score(cls, value: object) -> object:
        return _as_int(value)


class TrustJustifications(BaseModel):
    seguridad: str
    minimizacion: str
    transparencia: str
    derechos: str
    retencion: str
    terceros: str


class TrustEvaluation(BaseModel):
    scores: TrustScores
    justifications: TrustJustifications
    scoreTotal: int = Field(ge=0, le=100)
    grade: Literal["A", "B", "C", "D"]

    @field_validator("scoreTotal", mode="before")
    @classmethod
    def coerce_total(cls, value: object) -> object:
        return _as_int(value)
