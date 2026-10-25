"""Registra Expreso Caribe como cliente del SDK y guarda sus llaves en el .env.local de la demo.

La demo vive en su propio repo. Por defecto se asume clonada junto a este, en ../expreso-caribe.

Uso, desde backend/:

    python -m scripts.demo_client
    python -m scripts.demo_client --origin https://expreso-caribe.vercel.app
    python -m scripts.demo_client --env-file C:/ruta/a/expreso-caribe/.env.local
"""

import argparse
import secrets
from pathlib import Path

from app.api.clients import normalize_origin
from app.db.database import create_client, init_db
from app.services import hashing

NAME = "Expreso Caribe"
DEFAULT_ENV_FILE = Path(__file__).resolve().parents[3] / "expreso-caribe" / ".env.local"
ID_KEY = "NEXT_PUBLIC_ZEROID_CLIENT_ID"
SECRET_KEY = "ZEROID_CLIENT_SECRET"
DEFAULT_ORIGIN = "http://localhost:3001"


def write_env(env_file: Path, values: dict) -> None:
    lines = env_file.read_text(encoding="utf-8").splitlines() if env_file.exists() else []
    kept = [line for line in lines if line.split("=", 1)[0].strip() not in values]
    kept += [f"{key}={value}" for key, value in values.items()]
    env_file.write_text("\n".join(kept) + "\n", encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description="Registra el cliente de demostración de Expreso Caribe.")
    parser.add_argument("--origin", action="append", help=f"Origen autorizado. Por defecto {DEFAULT_ORIGIN}.")
    parser.add_argument("--env-file", type=Path, default=DEFAULT_ENV_FILE, help="Dónde guardar las llaves.")
    args = parser.parse_args()
    origins = sorted({normalize_origin(origin) for origin in args.origin or [DEFAULT_ORIGIN]})
    if not args.env_file.parent.is_dir():
        parser.error(f"No existe la carpeta {args.env_file.parent}. Clona la demo ahí o usa --env-file.")

    init_db()
    client_id = f"zid_live_{secrets.token_hex(8)}"
    client_secret = f"zsk_live_{secrets.token_urlsafe(32)}"
    create_client(client_id, hashing.hash_document(client_secret), NAME, origins, "")
    write_env(args.env_file, {ID_KEY: client_id, SECRET_KEY: client_secret})

    print(f"Listo. {NAME} quedó registrado como {client_id} para {', '.join(origins)}.")
    print(f"Las llaves se guardaron en {args.env_file}. Reinicia npm run dev para que las lea.")


if __name__ == "__main__":
    main()
