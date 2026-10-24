from functools import lru_cache
from typing import List

import numpy as np

from app.core.config import settings


@lru_cache
def _deepface():
    from deepface import DeepFace

    return DeepFace


def faces_match(selfie: np.ndarray, document: np.ndarray) -> bool:
    result = _deepface().verify(
        img1_path=selfie,
        img2_path=document,
        model_name=settings.face_model,
        enforce_detection=True,
    )
    return bool(result["verified"])


def embed_face(selfie: np.ndarray) -> List[float]:
    representations = _deepface().represent(
        img_path=selfie,
        model_name=settings.face_model,
        enforce_detection=True,
    )
    return representations[0]["embedding"]
