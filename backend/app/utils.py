from datetime import date, timedelta

# Supported prediction horizons -> calendar-day offsets.
# Kept as plain calendar days for simplicity; switch to trading-day
# math later if weekend gaps ever matter.
TIMEFRAME_DAYS: dict[str, int] = {
    "1D": 1,
    "3D": 3,
    "1W": 7,
    "2W": 14,
    "1M": 30,
    "3M": 90,
}


def timeframe_to_target_date(start: date, timeframe: str) -> date:
    """Compute the verification due-date from the logging date + horizon."""
    days = TIMEFRAME_DAYS.get(timeframe.upper())
    if days is None:
        raise ValueError(f"Unsupported timeframe: {timeframe}")
    return start + timedelta(days=days)