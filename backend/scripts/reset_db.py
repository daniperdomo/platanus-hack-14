"""Vacía los datos de ZeroID y conserva las tablas.

Uso, desde backend/:

    python -m scripts.reset_db --yes
"""

import argparse

from app.db.database import connect

# api_clients is kept on purpose: companies would have to request their API keys again.
TABLES = ("connections", "accounts", "auth_requests", "pairings", "push_tokens", "identities")


def counts() -> dict:
    with connect() as conn:
        return {
            table: conn.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
            for table in TABLES
        }


def reset() -> dict:
    before = counts()
    with connect() as conn:
        conn.execute(f"TRUNCATE {', '.join(TABLES)} RESTART IDENTITY CASCADE")
    return before


def main() -> None:
    parser = argparse.ArgumentParser(description="Borra todos los datos de la base de ZeroID.")
    parser.add_argument("--yes", action="store_true", help="Confirma el borrado.")
    args = parser.parse_args()
    if not args.yes:
        parser.error("Este comando borra identidades, cuentas y solicitudes. Repítelo con --yes.")

    before = reset()
    removed = sum(before.values())
    detail = ", ".join(f"{table}: {amount}" for table, amount in before.items())
    print(f"Listo. Se borraron {removed} filas ({detail}).")


if __name__ == "__main__":
    main()
