from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models  # noqa: F401  (register tables before create_all)
from app.database import Base, engine
from app.routers import analysis, hypotheses, signals

# Dev convenience: create tables on startup.
# Will swap to Alembic migrations once the schema stabilises.
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Hypothesis Log API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(signals.router)
app.include_router(hypotheses.router)
app.include_router(analysis.router)

@app.get("/health")
def health():
    return {"status": "ok"}

