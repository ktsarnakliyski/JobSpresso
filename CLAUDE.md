# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

JobSpresso is a job description analyzer and generator with voice profiles for agency recruiters and HR professionals. It combines rule-based scoring with AI-powered analysis using Claude API.

## Architecture

**Monorepo structure:**
- `frontend/` — Next.js 14 + TypeScript + Tailwind CSS
- `backend/` — FastAPI + Python
- `docker-compose.yml` — Orchestrates frontend, backend, and PostgreSQL

**Key architectural decisions:**
- Voice profiles stored in browser localStorage (no auth in MVP)
- Assessment combines rule-based scoring (readability, structure, completeness) with AI scoring (inclusivity, clarity, voice match)
- PostgreSQL for usage analytics only, not user data

## Commands

### Development

```bash
# Start all services
docker compose up

# Frontend only (port 3000)
cd frontend && npm run dev

# Backend only (port 8000)
cd backend && source .venv/bin/activate && uvicorn app.main:app --reload
```

### Testing

```bash
# Backend tests
cd backend && pytest

# Single test file
cd backend && pytest tests/test_models.py -v

# Single test
cd backend && pytest tests/test_models.py::test_function_name -v

# Frontend tests
cd frontend && npm test
```

### Docker

```bash
docker compose up -d          # Start in background
docker compose down           # Stop all
docker compose logs -f backend  # Follow backend logs
```

## API Endpoints

- `POST /api/analyze` — Analyze a job description
- `POST /api/generate` — Generate a job description from inputs
- `POST /api/voice/extract` — Extract voice profile from example JDs
- `GET /health` — Health check

## Assessment Scoring

Six categories with weights:
- Inclusivity (25%) — AI + bias word lists
- Readability (20%) — Flesch-Kincaid + AI jargon detection
- Structure (15%) — Rule-based section detection
- Completeness (15%) — Checklist (salary, location, benefits)
- Clarity (10%) — AI detection of vague phrases
- Voice Match (15%) — AI comparison to selected profile

## Implementation Plan

See `docs/plans/2026-01-06-jobspresso-mvp.md` for the detailed implementation plan with bite-sized tasks following TDD.
