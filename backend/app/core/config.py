from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql://zeroid:zeroid@localhost:5432/zeroid"
    jwt_private_key: str = ""
    credential_ttl_days: int = 365
    hash_pepper: str = "dev-pepper-change-me"
    cors_origins: str = "http://localhost:3000"

    face_model: str = "Facenet512"
    face_embedding_dim: int = 512
    duplicate_face_distance: float = 0.3
    adult_age: int = 18

    gemini_api_key: str = ""
    gemini_model: str = "gemini-3.8-flash"

    # Echoes the data read from the MRZ back to the client. Local debugging only, never in production.
    debug_passport: bool = False

    @property
    def cors_origin_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
