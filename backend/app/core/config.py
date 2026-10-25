from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict

DEFAULT_HASH_PEPPER = "dev-pepper-change-me"
# Published in the repo (default and .env.example), so they protect nothing.
INSECURE_HASH_PEPPERS = {"", DEFAULT_HASH_PEPPER, "cambia-esto-por-otro-secreto-largo"}


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql://zeroid:zeroid@localhost:5432/zeroid"
    # Direct (non-pooler) Neon endpoint: schema DDL must not go through PgBouncer.
    database_url_unpooled: str = ""
    jwt_private_key: str = ""
    credential_ttl_days: int = 365
    hash_pepper: str = DEFAULT_HASH_PEPPER
    cors_origins: str = "http://localhost:3000"

    face_model: str = "Facenet512"
    # Tried in order until one finds a face.
    face_detectors: str = "opencv,retinaface"
    face_embedding_dim: int = 512
    duplicate_face_distance: float = 0.3
    adult_age: int = 18

    gemini_api_key: str = ""
    gemini_model: str = "gemini-3.8-flash"

    # Echoes the data read from the MRZ back to the client. Local debugging only, never in production.
    debug_passport: bool = False

    @property
    def migration_database_url(self) -> str:
        return self.database_url_unpooled or self.database_url

    @property
    def cors_origin_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    def require_secrets(self) -> None:
        if not self.jwt_private_key.strip():
            raise RuntimeError(
                "JWT_PRIVATE_KEY no está definida: sin ella las credenciales no se pueden firmar."
            )
        if self.hash_pepper.strip() in INSECURE_HASH_PEPPERS:
            raise RuntimeError(
                "HASH_PEPPER mantiene un valor por defecto: los hashes de pasaporte serían reversibles."
            )


settings = Settings()
