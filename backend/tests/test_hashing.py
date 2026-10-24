from app.core.config import settings
from app.services import hashing


def test_normalize_rut_strips_format_and_uppercases_k():
    assert hashing.normalize_rut("12.345.678-k") == "12345678K"


def test_same_rut_in_any_format_gives_same_hash():
    assert hashing.hash_document("12.345.678-5") == hashing.hash_document("123456785")


def test_different_ruts_give_different_hashes():
    assert hashing.hash_document("12.345.678-5") != hashing.hash_document("11.111.111-1")


def test_hash_depends_on_pepper(monkeypatch):
    original = hashing.hash_document("12.345.678-5")
    monkeypatch.setattr(settings, "hash_pepper", "otro-pepper")
    assert hashing.hash_document("12.345.678-5") != original


def test_hash_never_contains_the_rut():
    digest = hashing.hash_document("12.345.678-5")
    assert len(digest) == 64
    assert "12345678" not in digest
