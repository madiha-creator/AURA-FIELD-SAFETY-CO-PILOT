"""
Configuration module - loads environment variables securely.

AUD-001: AssemblyAI API key is stored in environment variables only.
Never exposed to the client/frontend.
"""

import os
from dataclasses import dataclass
from dotenv import load_dotenv

# Load .env file from project root
load_dotenv()


@dataclass
class Config:
    """Application configuration - all values from environment variables."""

    # AUD-001: AssemblyAI API key (never exposed to client)
    ASSEMBLYAI_API_KEY: str = os.environ.get("ASSEMBLYAI_API_KEY", "")
    # TODO: Verify if API key is required at startup or can be lazy-loaded
    # If ASSEMBLYAI_API_KEY is empty, raise error or stub behavior

    # Application secrets
    SECRET_KEY: str = os.environ.get("SECRET_KEY", "dev-secret-change-me")
    # TODO: In production, SECRET_KEY should come from a secrets manager, not .env

    # Database configuration
    DATABASE_URL: str = os.environ.get("DATABASE_URL", "")
    # TODO: Configure database type (PostgreSQL, MySQL, SQLite, etc.)

    # Redis configuration (for persistent state management - BE-002)
    REDIS_URL: str = os.environ.get("REDIS_URL", "")
    # If empty, falls back to in-memory state manager

    # Token configuration
    TOKEN_EXPIRY_SECONDS: int = int(os.environ.get("TOKEN_EXPIRY_SECONDS", "300"))
    # AssemblyAI allows 1-600 seconds. Default: 300 (5 minutes)

    # AssemblyAI WebSocket endpoint (confirmed from docs)
    ASSEMBLYAI_WS_URL: str = os.environ.get(
        "ASSEMBLYAI_WS_URL", "wss://agents.assemblyai.com/v1/ws"
    )

    # AssemblyAI Voice Agent token minting endpoint
    # CONFIRMED from Voice Agent API docs: https://agents.assemblyai.com/v1/token
    # NOT api.assemblyai.com (that's the REST API)
    # NOT streaming.assemblyai.com (that's plain realtime STT)
    ASSEMBLYAI_TOKEN_URL: str = os.environ.get(
        "ASSEMBLYAI_TOKEN_URL", "https://agents.assemblyai.com/v1/token"
    )

    # Salesforce/Jira integration credentials (INT-001/002)
    SALESFORCE_USERNAME: str = os.environ.get("SALESFORCE_USERNAME", "")
    SALESFORCE_PASSWORD: str = os.environ.get("SALESFORCE_PASSWORD", "")
    SALESFORCE_SECURITY_TOKEN: str = os.environ.get("SALESFORCE_SECURITY_TOKEN", "")
    # TODO: Confirm exact Salesforce/Jira field names from real schema

    def validate(self) -> list[str]:
        """Validate required environment variables are set."""
        errors = []
        if not self.ASSEMBLYAI_API_KEY:
            errors.append("ASSEMBLYAI_API_KEY is not set")
        if not self.SECRET_KEY or self.SECRET_KEY == "dev-secret-change-me":
            errors.append("SECRET_KEY should be set to a secure value")
        return errors


# Global config instance
config = Config()


def get_config() -> Config:
    """Return the global configuration instance."""
    return config
