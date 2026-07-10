import logging
logging.basicConfig(level=logging.INFO)
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models  # noqa: F401  (register tables before create_all)
from app.database import Base, engine
from app.routers import analysis, hypotheses, signals
from app.scheduler import start_demo_scheduler, shutdown_demo_scheduler

# Dev convenience: create tables on startup.
# Will swap to Alembic migrations once the schema stabilises.
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Hypothesis Log API", version="0.1.0")

# CORS: allow the local Vite dev server plus any deployed frontends listed
# in the ALLOWED_ORIGINS env var (comma-separated). Set this on Render to
# your Vercel URL, e.g. "https://hypothesis-log.vercel.app".
_default_origins = ["http://localhost:5173"]
_env_origins = [
    o.strip() for o in os.getenv("ALLOWED_ORIGINS", "").split(",") if o.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_default_origins + _env_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(signals.router)
app.include_router(hypotheses.router)
app.include_router(analysis.router)


@app.on_event("startup")
def _startup():
    # Only starts the daily reset job when DEMO_MODE=true (i.e. the
    # deployed demo). Local runs leave it off, so real data is safe.
    start_demo_scheduler()


@app.on_event("shutdown")
def _shutdown():
    shutdown_demo_scheduler()


@app.get("/health")
def health():
    return {"status": "ok"}