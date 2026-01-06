from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    app_name: str = "JobSpresso API"
    debug: bool = True
    anthropic_api_key: str = ""
    database_url: str = "postgresql://jobspresso:jobspresso@localhost:5432/jobspresso"

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
