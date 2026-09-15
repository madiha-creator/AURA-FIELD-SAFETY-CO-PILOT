"""
Configuration module - loads environment variables securely.
"""

import os
from dataclasses import dataclass

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass


@dataclass
class Config:
    ASSEMBLYAI_API_KEY: str = os.environ.get("ASSEMBLYAI_API_KEY", "")
    SECRET_KEY: str = os.environ.get("SECRET_KEY", "dev-secret-change-me")
    DATABASE_URL: str = os.environ.get("DATABASE_URL", "sqlite:///aura.db")
    REDIS_URL: str = os.environ.get("REDIS_URL", "")
    TOKEN_EXPIRY_SECONDS: int = int(os.environ.get("TOKEN_EXPIRY_SECONDS", "300"))
    ASSEMBLYAI_WS_URL: str = os.environ.get(
        "ASSEMBLYAI_WS_URL", "wss://agents.assemblyai.com/v1/ws"
    )
    ASSEMBLYAI_TOKEN_URL: str = os.environ.get(
        "ASSEMBLYAI_TOKEN_URL", "https://agents.assemblyai.com/v1/token"
    )

    def validate(self) -> list[str]:
        errors = []
        if not self.ASSEMBLYAI_API_KEY:
            errors.append("ASSEMBLYAI_API_KEY is not set")
        return errors


config = Config()

def get_config() -> Config:
    return config
