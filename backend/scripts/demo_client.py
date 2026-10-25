"""Registra Expreso Caribe como cliente del SDK y guarda sus llaves en expreso-caribe/.env.local.

Uso, desde backend/:

    python -m scripts.demo_client
    python -m scripts.demo_client --origin https://expreso-caribe.vercel.app
"""

import argparse
import secrets
from pathlib import Path

from app.api.clients import normalize_origin
from app.db.database import create_client, init_db
from app.services import hashing

NAME = "Expreso Caribe"
ENV_FILE = Path(__file__).resolve().parents[2] / "expreso-caribe" / ".env.local"
ID_KEY = "NEXT_PUBLIC_ZEROID_CLIENT_ID"
SECRET_KEY = "ZEROID_CLIENT_SECRET"
DEFAULT_ORIGIN = "http://localhost:3001"


def write_env(values: dict) -> None:
    lines = ENV_FILE.read_text(encoding="utf-8").splitlines() if ENV_FILE.exists() else []
    kept = [line for line in lines if line.split("=", 1)[0].strip() not in values]
    kept += [f"{key}={value}" for key, value in values.items()]
    ENV_FILE.write_text("\n".join(kept) + "\n", encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description="Registra el cliente de demostración de Expreso Caribe.")
    parser.add_argument("--origin", action="append", help=f"Origen autorizado. Por defecto {DEFAULT_ORIGIN}.")
    args = parser.parse_args()
    origins = sorted({normalize_origin(origin) for origin in args.origin or [DEFAULT_ORIGIN]})

    init_db()
    client_id = f"zid_live_{secrets.token_hex(8)}"
    client_secret = f"zsk_live_{secrets.token_urlsafe(32)}"
    create_client(client_id, hashing.hash_document(client_secret), NAME, origins, "")
    write_env({ID_KEY: client_id, SECRET_KEY: client_secret})

    print(f"Listo. {NAME} quedó registrado como {client_id} para {', '.join(origins)}.")
    print(f"Las llaves se guardaron en {ENV_FILE}. Reinicia npm run dev para que las lea.")


if __name__ == "__main__":
    main()
