import numpy as np
import pytest

from app.services import face

IMAGE = np.zeros((4, 4, 3), dtype=np.uint8)


class FakeDeepFace:
    def __init__(self, finds_face_with):
        self.finds_face_with = finds_face_with
        self.tried = []

    def _detect(self, detector_backend):
        self.tried.append(detector_backend)
        if detector_backend not in self.finds_face_with:
            raise ValueError("Face could not be detected.")

    def extract_faces(self, img_path, detector_backend, enforce_detection):
        self._detect(detector_backend)
        return [{"confidence": 0.99}]

    def represent(self, img_path, model_name, detector_backend, enforce_detection):
        self._detect(detector_backend)
        return [{"embedding": [0.5] * 512}]


@pytest.fixture
def deepface(monkeypatch):
    def install(finds_face_with):
        fake = FakeDeepFace(finds_face_with)
        monkeypatch.setattr(face, "_deepface", lambda: fake)
        monkeypatch.setattr(face.settings, "face_detectors", "opencv,retinaface")
        return fake

    return install


def test_falls_back_to_the_next_detector(deepface):
    fake = deepface({"retinaface"})
    assert face.has_face(IMAGE)
    assert fake.tried == ["opencv", "retinaface"]


def test_stops_at_the_first_detector_that_finds_a_face(deepface):
    fake = deepface({"opencv", "retinaface"})
    assert face.embed_face(IMAGE) == [0.5] * 512
    assert fake.tried == ["opencv"]


def test_no_detector_finds_a_face(deepface):
    fake = deepface(set())
    assert not face.has_face(IMAGE)
    with pytest.raises(ValueError):
        face.embed_face(IMAGE)
    assert fake.tried == ["opencv", "retinaface", "opencv", "retinaface"]
