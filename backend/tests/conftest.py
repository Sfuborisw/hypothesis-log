"""Shared pytest fixtures.

Every test runs against a fresh in-memory SQLite database — the real
hypothesis_log.db is never touched. The app's get_db dependency is
overridden so the API talks to the throwaway session.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app


@pytest.fixture
def db_session():
    """A fresh in-memory DB per test. StaticPool keeps the same connection
    alive so the schema persists for the whole test."""
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    session = TestingSession()
    try:
        yield session
    finally:
        session.close()
        engine.dispose()


@pytest.fixture
def client(db_session):
    """TestClient wired to the in-memory DB."""

    def _override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def make_hypothesis():
    """Factory for a valid HypothesisCreate payload; override any field.

    Entry price is 100.0 so a verification price maps directly to a
    percentage move, which keeps the verification tests readable.
    """

    def _make(**overrides) -> dict:
        payload = {
            "ticker": "MU",
            "action": "buy",
            "entry_price": 100.0,
            "predicted_direction": "up",
            "confidence": 4,
            "timeframe": "1M",
            "reasoning": "test hypothesis",
        }
        payload.update(overrides)
        return payload

    return _make
