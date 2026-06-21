# Hypothesis Log

A trading journal that turns market gut-feelings into **verifiable hypotheses**,
auto-verifies them against real prices, and uses statistics to surface a
trader's personal *edge* — which signals and confidence levels actually hit.

## Stack
- **Frontend:** React + TypeScript + Vite
- **Backend:** FastAPI (Python)
- **Database:** SQLite (SQLAlchemy ORM) — Postgres-ready
- **Analysis:** pandas (hit-rate breakdowns, signal × hit correlation)
- **Automation:** yfinance (price fetch + auto-verification), APScheduler

## Status
🚧 In active development. Backend schema and API skeleton in place.

## Local development
\`\`\`bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
\`\`\`
API docs at http://localhost:8000/docs
