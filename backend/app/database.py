from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import settings

engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False},  # SQLite + FastAPI threads
)


# SQLite ignores foreign keys unless enabled per-connection
@event.listens_for(engine, "connect")
def _enable_fk(dbapi_conn, _):
    dbapi_conn.execute("PRAGMA foreign_keys=ON")


SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


def get_db():
    """FastAPI dependency: one session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
