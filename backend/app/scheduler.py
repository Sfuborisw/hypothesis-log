"""Daily demo-reset scheduler (only runs when DEMO_MODE=true).

Call start_demo_scheduler() from your FastAPI startup. On the local
machine DEMO_MODE is false, so this does nothing and real data is safe.
On the deployed demo (Render) DEMO_MODE=true enables the daily reset.
"""
import logging

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from app.config import settings
from app.demo_reset import reset_demo

logger = logging.getLogger("hyplog.scheduler")

_scheduler: BackgroundScheduler | None = None


def start_demo_scheduler() -> None:
    """Start the daily reset job — but only in demo mode."""
    global _scheduler
    if not settings.demo_mode:
        logger.info("DEMO_MODE off — reset scheduler not started")
        return
    if _scheduler is not None:
        return

    _scheduler = BackgroundScheduler(timezone=settings.demo_reset_timezone)
    _scheduler.add_job(
        reset_demo,
        CronTrigger(
            hour=settings.demo_reset_hour,
            minute=settings.demo_reset_minute,
            timezone=settings.demo_reset_timezone,
        ),
        id="demo_reset",
        replace_existing=True,
        misfire_grace_time=3600,  # if backend was asleep, still run within 1h of waking
    )
    _scheduler.start()
    logger.info(
        "Demo reset scheduler started: daily at %02d:%02d %s",
        settings.demo_reset_hour,
        settings.demo_reset_minute,
        settings.demo_reset_timezone,
    )


def shutdown_demo_scheduler() -> None:
    global _scheduler
    if _scheduler is not None:
        _scheduler.shutdown(wait=False)
        _scheduler = None
