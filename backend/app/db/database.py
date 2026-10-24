import uuid
from contextlib import contextmanager
from typing import Iterator, List, Optional

import numpy as np
import psycopg
from pgvector.psycopg import register_vector
from psycopg.types.json import Json

from app.core.config import settings


@contextmanager
def connect() -> Iterator[psycopg.Connection]:
    with psycopg.connect(settings.database_url, autocommit=True) as conn:
        register_vector(conn)
        yield conn


def init_db() -> None:
    with psycopg.connect(settings.database_url, autocommit=True) as conn:
        conn.execute("CREATE EXTENSION IF NOT EXISTS vector")
        conn.execute(
            f"""
            CREATE TABLE IF NOT EXISTS identities (
                id BIGSERIAL PRIMARY KEY,
                document_hash TEXT NOT NULL UNIQUE,
                face_embedding vector({settings.face_embedding_dim}) NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT now()
            )
            """
        )
        conn.execute(
            """
            ALTER TABLE identities
            ADD COLUMN IF NOT EXISTS credential_id UUID NOT NULL UNIQUE
            DEFAULT gen_random_uuid()
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS auth_requests (
                id UUID PRIMARY KEY,
                client_name TEXT NOT NULL,
                rules TEXT[] NOT NULL,
                challenge TEXT NOT NULL,
                disclosed_claims JSONB,
                credential_id UUID,
                expires_at TIMESTAMPTZ NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                approved_at TIMESTAMPTZ,
                consumed_at TIMESTAMPTZ
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS connections (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                credential_id UUID NOT NULL
                    REFERENCES identities (credential_id) ON DELETE CASCADE,
                client_name TEXT NOT NULL,
                rules TEXT[] NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT now()
            )
            """
        )


def document_exists(document_hash: str) -> bool:
    with connect() as conn:
        row = conn.execute(
            "SELECT 1 FROM identities WHERE document_hash = %s", (document_hash,)
        ).fetchone()
    return row is not None


def face_exists(embedding: List[float]) -> bool:
    with connect() as conn:
        row = conn.execute(
            """
            SELECT 1 FROM identities
            WHERE face_embedding <=> %s < %s
            LIMIT 1
            """,
            (np.array(embedding), settings.duplicate_face_distance),
        ).fetchone()
    return row is not None


def save_identity(document_hash: str, embedding: List[float]) -> str:
    with connect() as conn:
        row = conn.execute(
            """
            INSERT INTO identities (document_hash, face_embedding)
            VALUES (%s, %s)
            RETURNING credential_id
            """,
            (document_hash, np.array(embedding)),
        ).fetchone()
    return str(row[0])


def credential_exists(credential_id: uuid.UUID) -> bool:
    with connect() as conn:
        row = conn.execute(
            "SELECT 1 FROM identities WHERE credential_id = %s", (credential_id,)
        ).fetchone()
    return row is not None


def create_auth_request(client_name: str, rules: List[str], challenge: str, ttl_seconds: int) -> str:
    request_id = uuid.uuid4()
    with connect() as conn:
        conn.execute(
            """
            INSERT INTO auth_requests (id, client_name, rules, challenge, expires_at)
            VALUES (%s, %s, %s, %s, NOW() + make_interval(secs => %s))
            """,
            (request_id, client_name, rules, challenge, ttl_seconds),
        )
    return str(request_id)


def get_auth_request(request_id: uuid.UUID) -> Optional[dict]:
    with connect() as conn:
        row = conn.execute(
            """
            SELECT client_name, rules, challenge, disclosed_claims, credential_id,
                   approved_at, consumed_at, expires_at <= NOW()
            FROM auth_requests
            WHERE id = %s
            """,
            (request_id,),
        ).fetchone()
    if row is None:
        return None
    claims = row[3]
    return {
        "client_name": row[0],
        "rules": list(row[1]),
        "challenge": row[2],
        "disclosed_claims": claims,
        "credential_id": str(row[4]) if row[4] else None,
        "approved": row[5] is not None,
        "consumed": row[6] is not None,
        "expired": row[7],
    }


def approve_auth_request(
    request_id: uuid.UUID, credential_id: uuid.UUID, disclosed_claims: dict
) -> bool:
    with psycopg.connect(settings.database_url) as conn:
        with conn.transaction():
            row = conn.execute(
                """
                UPDATE auth_requests
                SET approved_at = NOW(), disclosed_claims = %s, credential_id = %s
                WHERE id = %s
                  AND approved_at IS NULL
                  AND consumed_at IS NULL
                  AND expires_at > NOW()
                RETURNING client_name, rules
                """,
                (Json(disclosed_claims), credential_id, request_id),
            ).fetchone()
            if row is None:
                return False
            conn.execute(
                """
                INSERT INTO connections (credential_id, client_name, rules)
                VALUES (%s, %s, %s)
                """,
                (credential_id, row[0], list(row[1])),
            )
    return True


def consume_auth_request(request_id: uuid.UUID) -> Optional[dict]:
    with psycopg.connect(settings.database_url) as conn:
        row = conn.execute(
            """
            UPDATE auth_requests
            SET consumed_at = NOW()
            WHERE id = %s
              AND approved_at IS NOT NULL
              AND consumed_at IS NULL
              AND expires_at > NOW()
            RETURNING client_name, disclosed_claims
            """,
            (request_id,),
        ).fetchone()
        conn.commit()
    if row is None:
        return None
    return {"client_name": row[0], "claims": row[1]}


def list_connections(credential_id: uuid.UUID) -> List[dict]:
    with connect() as conn:
        rows = conn.execute(
            """
            SELECT id, client_name, rules, created_at
            FROM connections
            WHERE credential_id = %s
            ORDER BY created_at DESC
            """,
            (credential_id,),
        ).fetchall()
    return [
        {
            "id": str(row[0]),
            "client_name": row[1],
            "rules": list(row[2]),
            "created_at": row[3],
        }
        for row in rows
    ]
