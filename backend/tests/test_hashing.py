from app.core.config import settings
from app.services import hashing


def test_different_documents_give_different_hashes():
    assert hashing.hash_document("CHL-AB1234567") != hashing.hash_document("CHL-AB7654321")


def test_same_number_from_different_countries_never_collides():
    assert hashing.hash_document("CHL-AB1234567") != hashing.hash_document("VEN-AB1234567")


def test_hash_depends_on_pepper(monkeypatch):
    original = hashing.hash_document("CHL-AB1234567")
    monkeypatch.setattr(settings, "hash_pepper", "otro-pepper")
    assert hashing.hash_document("CHL-AB1234567") != original


def test_hash_never_contains_the_document_number():
    digest = hashing.hash_document("CHL-AB1234567")
    assert len(digest) == 64
    assert "AB1234567" not in digest
