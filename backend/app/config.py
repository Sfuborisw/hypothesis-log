from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "sqlite:///./hypothesis_log.db"
    # +/- this % around entry price counts as "sideways" at verification
    sideways_threshold_pct: float = 2.0

    # Demo mode: when True, a scheduled job resets the DB to the demo
    # baseline daily. MUST stay False locally so real data is never wiped.
    demo_mode: bool = False
    demo_reset_hour: int = 0
    demo_reset_minute: int = 0
    demo_reset_timezone: str = "UTC"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()