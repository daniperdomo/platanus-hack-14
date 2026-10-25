import logging
from functools import lru_cache
from typing import Callable, List, TypeVar

import numpy as np

from app.core.config import settings

logger = logging.getLogger(__name__)

T = TypeVar("T")


@lru_cache
def _deepface():
    from deepface import DeepFace

    return DeepFace


def detectors() -> List[str]:
    return [name.strip() for name in settings.face_detectors.split(",") if name.strip()]


def warm_up() -> None:
    _deepface().build_model(settings.face_model)
    for detector in detectors():
        if detector != "opencv":
            _deepface().build_model(detector, task="face_detector")


def _with_fallback(run: Callable[[str], T]) -> T:
    """The OpenCV cascade is fast but misses dim or angled faces; heavier detectors retry those."""
    error: ValueError = ValueError("No hay detectores de rostro configurados.")
    for detector in detectors():
        try:
            return run(detector)
        except ValueError as exc:
            logger.info("El detector %s no encontró un rostro: %s", detector, exc)
            error = exc
    raise error


def has_face(image: np.ndarray) -> bool:
    try:
        _with_fallback(
            lambda detector: _deepface().extract_faces(
                img_path=image, detector_backend=detector, enforce_detection=True
            )
        )
    except ValueError:
        return False
    return True


def faces_match(selfie: np.ndarray, document: np.ndarray) -> bool:
    result = _with_fallback(
        lambda detector: _deepface().verify(
            img1_path=selfie,
            img2_path=document,
            model_name=settings.face_model,
            detector_backend=detector,
            enforce_detection=True,
        )
    )
    return bool(result["verified"])


def embed_face(selfie: np.ndarray) -> List[float]:
    representations = _with_fallback(
        lambda detector: _deepface().represent(
            img_path=selfie,
            model_name=settings.face_model,
            detector_backend=detector,
            enforce_detection=True,
        )
    )
    return representations[0]["embedding"]
