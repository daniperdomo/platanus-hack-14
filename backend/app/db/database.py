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
            ALTER TABLE auth_requests
            ADD COLUMN IF NOT EXISTS client_domain TEXT NOT NULL DEFAULT ''
            """
        )
        conn.execute(
            """
            ALTER TABLE auth_requests
            ADD COLUMN IF NOT EXISTS field_meta JSONB
            """
        )
        conn.execute(
            """
            ALTER TABLE auth_requests
            ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'third_party'
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
        conn.execute(
            """
            ALTER TABLE connections
            ADD COLUMN IF NOT EXISTS client_domain TEXT NOT NULL DEFAULT ''
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS accounts (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                credential_id UUID NOT NULL UNIQUE
                    REFERENCES identities (credential_id) ON DELETE CASCADE,
                username TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                email_hash TEXT UNIQUE,
                vault_ciphertext TEXT NOT NULL,
                wrapped_key TEXT NOT NULL,
                wrap_salt TEXT NOT NULL,
                wrap_iterations INTEGER NOT NULL,
                paired_at TIMESTAMPTZ,
                created_at TIMESTAMPTZ NOT NULL DEFAULT now()
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS pairings (
                id UUID PRIMARY KEY,
                payload TEXT NOT NULL,
                expires_at TIMESTAMPTZ NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                consumed_at TIMESTAMPTZ
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS api_clients (
                client_id TEXT PRIMARY KEY,
                secret_hash TEXT NOT NULL,
                name TEXT NOT NULL,
                origins TEXT[] NOT NULL,
                redirect_uri TEXT NOT NULL DEFAULT '',
                created_at TIMESTAMPTZ NOT NULL DEFAULT now()
            )
            """
        )
        conn.execute(
            """
            ALTER TABLE auth_requests
            ADD COLUMN IF NOT EXISTS client_id TEXT
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS push_tokens (
                token TEXT PRIMARY KEY,
                credential_id UUID NOT NULL
                    REFERENCES identities (credential_id) ON DELETE CASCADE,
                updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
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


def create_auth_request(
    client_name: str,
    rules: List[str],
    challenge: str,
    ttl_seconds: int,
    client_domain: str = "",
    fields: Optional[list] = None,
    kind: str = "third_party",
    credential_id: Optional[str] = None,
    client_id: Optional[str] = None,
) -> str:
    request_id = uuid.uuid4()
    owner = uuid.UUID(str(credential_id)) if credential_id else None
    with connect() as conn:
        conn.execute(
            """
            INSERT INTO auth_requests (
                id, client_name, client_domain, rules, field_meta, challenge,
                kind, credential_id, client_id, expires_at
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW() + make_interval(secs => %s))
            """,
            (
                request_id,
                client_name,
                client_domain,
                rules,
                Json(fields) if fields is not None else None,
                challenge,
                kind,
                owner,
                client_id,
                ttl_seconds,
            ),
        )
    return str(request_id)


def get_auth_request(request_id: uuid.UUID) -> Optional[dict]:
    with connect() as conn:
        row = conn.execute(
            """
            SELECT client_name, client_domain, rules, field_meta, challenge,
                   disclosed_claims, credential_id, kind,
                   approved_at, consumed_at, expires_at <= NOW(),
                   GREATEST(0, EXTRACT(EPOCH FROM (expires_at - NOW()))),
                   client_id
            FROM auth_requests
            WHERE id = %s
            """,
            (request_id,),
        ).fetchone()
    if row is None:
        return None
    rules = list(row[2])
    fields = row[3] if row[3] else [
        {"field": rule, "purpose": "", "retention": "", "required": True} for rule in rules
    ]
    return {
        "client_name": row[0],
        "client_domain": row[1] or "",
        "rules": rules,
        "fields": fields,
        "challenge": row[4],
        "disclosed_claims": row[5],
        "credential_id": str(row[6]) if row[6] else None,
        "kind": row[7] or "third_party",
        "approved": row[8] is not None,
        "consumed": row[9] is not None,
        "expired": row[10],
        "expires_in": int(row[11]),
        "client_id": row[12],
    }


def approve_auth_request(
    request_id: uuid.UUID,
    credential_id: uuid.UUID,
    disclosed_claims: dict,
    record_connection: bool = True,
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
                RETURNING client_name, client_domain, rules
                """,
                (Json(disclosed_claims), credential_id, request_id),
            ).fetchone()
            if row is None:
                return False
            if record_connection:
                conn.execute(
                    """
                    INSERT INTO connections (credential_id, client_name, client_domain, rules)
                    VALUES (%s, %s, %s, %s)
                    """,
                    (credential_id, row[0], row[1] or "", list(row[2])),
                )
    return True


def reject_auth_request(request_id: uuid.UUID) -> bool:
    with psycopg.connect(settings.database_url) as conn:
        row = conn.execute(
            """
            UPDATE auth_requests
            SET consumed_at = NOW()
            WHERE id = %s
              AND approved_at IS NULL
              AND consumed_at IS NULL
              AND expires_at > NOW()
            RETURNING id
            """,
            (request_id,),
        ).fetchone()
        conn.commit()
    return row is not None


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
            RETURNING client_name, disclosed_claims, credential_id, client_id
            """,
            (request_id,),
        ).fetchone()
        conn.commit()
    if row is None:
        return None
    return {
        "client_name": row[0],
        "claims": row[1],
        "credential_id": str(row[2]) if row[2] else None,
        "client_id": row[3],
    }


def list_connections(credential_id: uuid.UUID) -> List[dict]:
    with connect() as conn:
        rows = conn.execute(
            """
            SELECT id, client_name, client_domain, rules, created_at
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
            "client_domain": row[2] or "",
            "rules": list(row[3]),
            "created_at": row[4],
        }
        for row in rows
    ]


def _request_fields(rules, field_meta) -> list:
    if field_meta:
        return field_meta
    return [{"field": rule, "purpose": "", "retention": "", "required": True} for rule in rules]


def list_inbox(credential_id: uuid.UUID) -> List[dict]:
    with connect() as conn:
        rows = conn.execute(
            """
            SELECT id, client_name, client_domain, rules, field_meta, challenge, kind,
                   GREATEST(0, EXTRACT(EPOCH FROM (expires_at - NOW())))
            FROM auth_requests
            WHERE credential_id = %s
              AND approved_at IS NULL
              AND consumed_at IS NULL
              AND expires_at > NOW()
            ORDER BY created_at ASC
            """,
            (credential_id,),
        ).fetchall()
    return [
        {
            "request_id": str(row[0]),
            "client_name": row[1],
            "client_domain": row[2] or "",
            "fields": _request_fields(list(row[3]), row[4]),
            "challenge": row[5],
            "kind": row[6] or "third_party",
            "expires_in": int(row[7]),
        }
        for row in rows
    ]


def create_account(
    credential_id: uuid.UUID,
    username: str,
    password_hash: str,
    email_hash: Optional[str],
    vault_ciphertext: str,
    wrapped_key: str,
    wrap_salt: str,
    wrap_iterations: int,
) -> None:
    with connect() as conn:
        conn.execute(
            """
            INSERT INTO accounts (
                credential_id, username, password_hash, email_hash,
                vault_ciphertext, wrapped_key, wrap_salt, wrap_iterations
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                credential_id,
                username,
                password_hash,
                email_hash,
                vault_ciphertext,
                wrapped_key,
                wrap_salt,
                wrap_iterations,
            ),
        )


def get_account_by_username(username: str) -> Optional[dict]:
    with connect() as conn:
        row = conn.execute(
            """
            SELECT credential_id, username, password_hash, vault_ciphertext,
                   wrapped_key, wrap_salt, wrap_iterations, paired_at
            FROM accounts
            WHERE username = %s
            """,
            (username,),
        ).fetchone()
    return _account_row(row)


def get_account_by_credential(credential_id: uuid.UUID) -> Optional[dict]:
    with connect() as conn:
        row = conn.execute(
            """
            SELECT credential_id, username, password_hash, vault_ciphertext,
                   wrapped_key, wrap_salt, wrap_iterations, paired_at
            FROM accounts
            WHERE credential_id = %s
            """,
            (credential_id,),
        ).fetchone()
    return _account_row(row)


def _account_row(row) -> Optional[dict]:
    if row is None:
        return None
    return {
        "credential_id": str(row[0]),
        "username": row[1],
        "password_hash": row[2],
        "vault_ciphertext": row[3],
        "wrapped_key": row[4],
        "wrap_salt": row[5],
        "wrap_iterations": row[6],
        "paired": row[7] is not None,
    }


def mark_account_paired(credential_id: uuid.UUID) -> None:
    with connect() as conn:
        conn.execute(
            "UPDATE accounts SET paired_at = NOW() WHERE credential_id = %s",
            (credential_id,),
        )


def create_pairing(payload: str, ttl_seconds: int) -> str:
    pairing_id = uuid.uuid4()
    with connect() as conn:
        conn.execute(
            """
            INSERT INTO pairings (id, payload, expires_at)
            VALUES (%s, %s, NOW() + make_interval(secs => %s))
            """,
            (pairing_id, payload, ttl_seconds),
        )
    return str(pairing_id)


def claim_pairing(pairing_id: uuid.UUID) -> Optional[str]:
    with psycopg.connect(settings.database_url) as conn:
        row = conn.execute(
            """
            UPDATE pairings
            SET consumed_at = NOW()
            WHERE id = %s
              AND consumed_at IS NULL
              AND expires_at > NOW()
            RETURNING payload
            """,
            (pairing_id,),
        ).fetchone()
        conn.commit()
    if row is None:
        return None
    return row[0]


def create_client(
    client_id: str, secret_hash: str, name: str, origins: List[str], redirect_uri: str
) -> None:
    with connect() as conn:
        conn.execute(
            """
            INSERT INTO api_clients (client_id, secret_hash, name, origins, redirect_uri)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (client_id, secret_hash, name, origins, redirect_uri),
        )


def get_client(client_id: str) -> Optional[dict]:
    with connect() as conn:
        row = conn.execute(
            """
            SELECT client_id, secret_hash, name, origins, redirect_uri
            FROM api_clients
            WHERE client_id = %s
            """,
            (client_id,),
        ).fetchone()
    if row is None:
        return None
    return {
        "client_id": row[0],
        "secret_hash": row[1],
        "name": row[2],
        "origins": list(row[3]),
        "redirect_uri": row[4] or "",
    }


def save_push_token(credential_id: uuid.UUID, token: str) -> None:
    with connect() as conn:
        conn.execute(
            """
            INSERT INTO push_tokens (token, credential_id)
            VALUES (%s, %s)
            ON CONFLICT (token)
            DO UPDATE SET credential_id = EXCLUDED.credential_id, updated_at = NOW()
            """,
            (token, credential_id),
        )


def list_push_tokens(credential_id: uuid.UUID) -> List[str]:
    with connect() as conn:
        rows = conn.execute(
            "SELECT token FROM push_tokens WHERE credential_id = %s",
            (credential_id,),
        ).fetchall()
    return [row[0] for row in rows]
