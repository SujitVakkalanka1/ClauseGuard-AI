import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Contract Clause Risk Tagger"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    DATABASE_URL: str = "sqlite:///./contracts.db"
    
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4o-mini"
    
    GEMINI_API_KEY: Optional[str] = None
    
    # Algorand TestNet Configuration (Loaded strictly from .env)
    ALGORAND_SENDER_MNEMONIC: Optional[str] = None
    ALGORAND_RECIPIENT_ADDRESS: str = "ULDGSMHBVIIXNZO3W4H6GTHSYPCAFQ6SV5CWZGONABA22RLBLTI4LBFWAQ"
    ALGORAND_ALGOD_SERVER: str = "https://testnet-api.algonode.cloud"
    ALGORAND_ALGOD_TOKEN: str = ""

    model_config = SettingsConfigDict(
        env_file=("backend/.env", ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
