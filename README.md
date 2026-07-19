# Hypothesis Log

[![Tests](https://github.com/Sfuborisw/hypothesis-log/actions/workflows/test.yml/badge.svg)](https://github.com/Sfuborisw/hypothesis-log/actions/workflows/test.yml)

A trading journal that turns market gut-feelings into **verifiable hypotheses**, auto-verifies them against real prices, and uses statistics to surface a trader's personal *edge* — which signals and confidence levels actually hit.

**[Live Demo](https://hypothesis-log.vercel.app)** · deployed on Vercel (frontend) + Render (API) + Supabase (Postgres)

## Stack
- **Frontend:** React + TypeScript + Vite
- **Backend:** FastAPI (Python) + SQLAlchemy
- **Database:** Postgres (Supabase) in production; SQLite for local dev
- **Analysis:** pandas (hit-rate breakdowns, signal × hit correlation)
- **Automation:** yfinance (price fetch + auto-verification), APScheduler
- **Testing / CI:** pytest (22 tests) run on GitHub Actions

## Features
- **Verifiable hypotheses** — log a trade idea as a falsifiable claim (ticker, direction, confidence, timeframe) with a target verification date.
- **Auto-verification** — verify against the actual price; the backend computes hit/miss and % move (±2% counts as sideways).
- **Edge analytics** — pandas-computed hit rate broken down by signal and confidence level.
- **Live demo sandbox** — a curated demo baseline that resets daily, so visitors can freely add, verify, and delete.

## Local development
```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```
API docs at http://localhost:8000/docs

## Tests
```bash
cd backend
pip install -r requirements-dev.txt
pytest -v
```

## Related
- **[CLAW BOT](https://github.com/Sfuborisw/claw-bot)** — an autonomous Signal-based AI agent that consumes this service's API to query, log, and verify hypotheses in natural language.