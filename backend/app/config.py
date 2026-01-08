from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    app_name: str = "JobSpresso API"
    debug: bool = False  # Default to False for security; override via DEBUG env var
    anthropic_api_key: str = ""
    database_url: str = "postgresql://jobspresso:jobspresso@localhost:5432/jobspresso"
    cors_origins: str = "http://localhost:3100"  # Comma-separated for multiple origins
    claude_model: str = "claude-sonnet-4-5-20250929"  # Claude model to use for AI analysis

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
