import pytest
from starlette.formparsers import MultiPartParser

from app.core.config import DEFAULT_HASH_PEPPER, Settings
from app.main import MAX_UPLOAD_BYTES, UPLOAD_PATHS


def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_accepted_uploads_never_spool_to_disk():
    assert MAX_UPLOAD_BYTES == 10 * 1024 * 1024
    assert MultiPartParser.spool_max_size == MAX_UPLOAD_BYTES


@pytest.mark.parametrize("path", sorted(UPLOAD_PATHS))
def test_upload_above_10mb_is_413(client, path):
    response = client.post(
        path,
        content=b"x",
        headers={"content-type": "multipart/form-data; boundary=x", "content-length": str(MAX_UPLOAD_BYTES + 1)},
    )
    assert response.status_code == 413


@pytest.mark.parametrize("path", sorted(UPLOAD_PATHS))
def test_upload_without_content_length_is_413(client, path):
    # A generator body is sent chunked, without Content-Length.
    response = client.post(
        path,
        content=iter([b"x"]),
        headers={"content-type": "multipart/form-data; boundary=x"},
    )
    assert response.status_code == 413


def test_size_limit_does_not_touch_other_routes(client):
    response = client.post("/verify", content=iter([b"{}"]), headers={"content-type": "application/json"})
    assert response.status_code != 413


def test_startup_refuses_missing_jwt_private_key():
    with pytest.raises(RuntimeError, match="JWT_PRIVATE_KEY"):
        Settings(jwt_private_key="", hash_pepper="un-secreto-real").require_secrets()


@pytest.mark.parametrize("pepper", [DEFAULT_HASH_PEPPER, "cambia-esto-por-otro-secreto-largo", ""])
def test_startup_refuses_default_hash_pepper(pepper):
    with pytest.raises(RuntimeError, match="HASH_PEPPER"):
        Settings(jwt_private_key="pem", hash_pepper=pepper).require_secrets()


def test_startup_accepts_real_secrets():
    Settings(jwt_private_key="pem", hash_pepper="un-secreto-real").require_secrets()


def test_cors_allows_frontend_origin(client):
    response = client.options(
        "/verify",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
        },
    )
    assert response.headers.get("access-control-allow-origin") == "http://localhost:3000"
