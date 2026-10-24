from starlette.formparsers import MultiPartParser

from app.main import MAX_UPLOAD_IN_MEMORY


def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_uploads_stay_in_memory_up_to_20mb():
    assert MAX_UPLOAD_IN_MEMORY == 20 * 1024 * 1024
    assert MultiPartParser.spool_max_size == MAX_UPLOAD_IN_MEMORY


def test_cors_allows_frontend_origin(client):
    response = client.options(
        "/verify",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
        },
    )
    assert response.headers.get("access-control-allow-origin") == "http://localhost:3000"
