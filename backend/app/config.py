from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "sqlite:///./hypothesis_log.db"
    # +/- this % around entry price counts as "sideways" at verification
    sideways_threshold_pct: float = 2.0

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
