# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

JobSpresso is a job description analyzer and generator with voice profiles for agency recruiters and HR professionals. It combines rule-based scoring with AI-powered analysis using Claude API.

## Architecture

**Monorepo structure:**
- `frontend/` — Next.js 16 (Turbopack) + TypeScript + Tailwind CSS + PostHog analytics
- `backend/` — FastAPI + Python 3.12
- `docker-compose.yml` — Development (ports 3100/8100)
- `docker-compose.prod.yml` — Production (internal ports, Caddy network)

**Key architectural decisions:**
- Voice profiles stored in browser localStorage (no auth in MVP)
- Assessment combines rule-based scoring (readability, structure, completeness) with AI scoring (inclusivity, clarity, voice match)
- PostgreSQL for usage analytics only, not user data
- Single `.env` file in root for all services
- PostHog for product analytics — initialized via `instrumentation-client.ts`, proxied through `/ingest` rewrites in `next.config.mjs`
- ESLint 9 flat config (`eslint.config.mjs`) — do not create `.eslintrc` files

## Commands

### Development

```bash
# Start all services (recommended)
docker compose up

# Frontend only (port 3100)
cd frontend && npm run dev -- -p 3100

# Backend only (port 8100)
cd backend && uvicorn app.main:app --reload --port 8100
```

### Testing

```bash
# Backend tests
cd backend && pytest

# Single test file
cd backend && pytest tests/test_models.py -v

# Frontend build check
cd frontend && npm run build
```

### Docker

```bash
docker compose up -d          # Start in background
docker compose down           # Stop all
docker compose down -v        # Stop + remove database volume
docker compose logs -f backend  # Follow backend logs
```

### Production

```bash
# Build and deploy (on server)
docker compose -f docker-compose.prod.yml up -d --build

# View logs
docker compose -f docker-compose.prod.yml logs -f

# Restart after code changes
docker compose -f docker-compose.prod.yml up -d --build
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

## Ports

| Environment | Frontend | Backend | Database |
|-------------|----------|---------|----------|
| Development | 3100 | 8100 | 5433 |
| Production | 3000 (internal) | 8000 (internal) | 5432 (internal) |

Production services are only accessible via Caddy reverse proxy on ports 80/443.

## When to Rebuild

**Always rebuild after:**
- Changing Python dependencies (`backend/requirements.txt`)
- Changing Node dependencies (`frontend/package.json`)
- Modifying Dockerfiles
- Changing environment variables in docker-compose

```bash
# Development - rebuild all
docker compose up --build

# Development - rebuild specific service
docker compose up --build backend

# Production
docker compose -f docker-compose.prod.yml up -d --build
```

**Hot reload works for:**
- Frontend code changes (Next.js)
- Backend code changes (uvicorn --reload)

**IMPORTANT - Frontend Cache in Docker:**
The frontend container uses an anonymous volume for `.next` cache (`/app/.next`). This cache persists across restarts and is separate from the host filesystem. If you see "Element type is invalid" or "React Client Manifest" errors after adding new components:

```bash
# Recreate the frontend container to clear its .next cache
docker compose stop frontend && docker compose rm -f frontend && docker compose up -d frontend
```

This is necessary because `docker compose restart` doesn't clear anonymous volumes.

## Files Reference

- `.env.example` — Environment template (copy to `.env`, includes PostHog keys)
- `Caddyfile.example` — Caddy config template for production
- `DEPLOYMENT_TEMP.md` — Full deployment guide (gitignored)
