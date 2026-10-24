from contextlib import contextmanager
from typing import Iterator, List

import numpy as np
import psycopg
from pgvector.psycopg import register_vector

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


def save_identity(document_hash: str, embedding: List[float]) -> None:
    with connect() as conn:
        conn.execute(
            "INSERT INTO identities (document_hash, face_embedding) VALUES (%s, %s)",
            (document_hash, np.array(embedding)),
        )
