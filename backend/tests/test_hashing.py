from app.core.config import settings
from app.services import hashing


def test_normalize_rut_strips_format_and_uppercases_k():
    assert hashing.normalize_rut("12.345.678-k") == "12345678K"


def test_different_documents_give_different_hashes():
    assert hashing.hash_document("123456785") != hashing.hash_document("111111111")


def test_chilean_and_venezuelan_ids_never_collide():
    assert hashing.hash_document("12345678") != hashing.hash_document("VE-V12345678")


def test_hash_depends_on_pepper(monkeypatch):
    original = hashing.hash_document("123456785")
    monkeypatch.setattr(settings, "hash_pepper", "otro-pepper")
    assert hashing.hash_document("123456785") != original


def test_hash_never_contains_the_document_number():
    digest = hashing.hash_document("VE-V12345678")
    assert len(digest) == 64
    assert "12345678" not in digest
