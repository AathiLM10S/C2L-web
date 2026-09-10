import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "C2L QC Management API"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "c2l_secret_key_change_in_production_9f8e7d6c5b4a")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    _raw_db_url: str = os.getenv(
        "DATABASE_URL", 
        "postgresql://postgres:12345@localhost:5433/c2l_qc"
    )

    @property
    def DATABASE_URL(self) -> str:
        url = self._raw_db_url
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        return url

    class Config:
        case_sensitive = True

settings = Settings()
