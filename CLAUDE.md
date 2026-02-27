# CLAUDE.md

## What This Is

JobSpresso is a job description analyzer and generator with voice profiles for agency recruiters and HR professionals. It combines rule-based scoring with AI-powered analysis (Claude API) to assess JD quality across six categories, generate improved JDs, and match writing to custom voice profiles. Live at https://jobspresso.ktexperience.com.

## Stack

**Frontend:** Next.js 16 (Turbopack) + React 19 + TypeScript + Tailwind CSS 3.4 + PostHog analytics
**Backend:** FastAPI + Python 3.12 + Anthropic SDK + textstat + SQLAlchemy/Alembic + PostgreSQL 16
**Infrastructure:** Docker Compose (dev + prod), Caddy reverse proxy (prod), GitHub Actions CI/CD
**Key libraries:** slowapi (rate limiting), pydantic-settings, httpx, posthog-js, clsx, tailwind-merge

## Local Dev

```bash
# Prerequisites: Docker Desktop running

# 1. Copy env file
cp .env.example .env
# Fill in ANTHROPIC_API_KEY (required), PostHog keys (optional)

# 2. Start all services
docker compose up

# Frontend: http://localhost:3100 | Backend: http://localhost:8100 | DB: localhost:5433

# Frontend only (without Docker)
cd frontend && npm install && npm run dev -- -p 3100

# Backend only (without Docker)
cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload --port 8100
```

Hot reload works for both frontend (Next.js) and backend (uvicorn --reload) via volume mounts.

**Docker cache gotcha:** Frontend uses anonymous volume for `.next`. If you see "Element type is invalid" or "React Client Manifest" errors:
```bash
docker compose stop frontend && docker compose rm -f frontend && docker compose up -d frontend
```

## Deploy

**CI/CD:** Push to `main` → GitHub Actions (`.github/workflows/deploy.yml`):
1. SSH to server, `git pull`, build backend, run `pytest`
2. If tests pass → `docker compose -f docker-compose.prod.yml up -d --build`
3. Health check with 6 retries (10s apart)
4. On failure → automatic rollback to pre-deploy SHA via `git reset --hard`
5. Discord notifications on success/failure

**Prod ports:** Frontend 3000, Backend 8000, DB 5432 — all internal, exposed via Caddy on 80/443.

**Rebuild required after:** changing `requirements.txt`, `package.json`, Dockerfiles, or env vars in docker-compose.

## Test

```bash
# Backend (14 test files, pytest)
cd backend && pytest
cd backend && pytest tests/test_models.py -v  # single file

# Frontend (build check — no unit tests yet)
cd frontend && npm run build

# Lint
cd frontend && npm run lint
```

Backend tests cover: models, scoring, assessment service, Claude service, voice profiles, prompt security, field mappings, question analyzer, frontend sync, and all three API endpoints (analyze, generate, voice).

## Project Structure

```
├── frontend/
│   ├── src/
│   │   ├── app/              # Next.js pages: /, /analyze, /generate, /profiles
│   │   ├── components/       # UI components + voice/ subfolder
│   │   │   ├── ui/           # Reusable primitives (Button, Card, Modal, TextArea, etc.)
│   │   │   ├── voice/        # VoiceProfileEditor, GuidedQuestionnaire, ExampleUpload
│   │   │   ├── AnalysisHistory.tsx, ScoreDisplay.tsx, CircularScore.tsx, etc.
│   │   ├── hooks/            # useAnalysisHistory
│   │   ├── lib/              # Utilities
│   │   └── types/            # TypeScript types (assessment, voice-profile, history)
│   ├── instrumentation-client.ts  # PostHog init
│   ├── next.config.mjs       # PostHog /ingest proxy rewrites
│   ├── eslint.config.mjs     # ESLint 9 flat config (do NOT create .eslintrc)
│   └── Dockerfile / Dockerfile.prod
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI app, CORS, security headers, rate limiting
│   │   ├── config.py         # pydantic-settings config
│   │   ├── rate_limit.py     # slowapi rate limiter
│   │   ├── routers/          # analyze.py, generate.py, voice.py
│   │   ├── services/         # assessment_service, claude_service, scoring, issue_detector, question_analyzer, field_mappings
│   │   ├── models/           # assessment.py, voice_profile.py
│   │   └── prompts/          # analysis, generation, improvement, voice_extraction prompts
│   ├── tests/                # 14 test files
│   └── Dockerfile / Dockerfile.prod
├── docker-compose.yml        # Dev (ports 3100/8100/5433)
├── docker-compose.prod.yml   # Prod (Caddy network, internal ports)
├── .github/workflows/deploy.yml  # CI/CD with rollback
├── analyses/                 # Code audit docs
├── docs/plans/               # Feature planning docs
├── .env.example              # Env template
└── Caddyfile.example         # Caddy config template
```

## Current State

- **MVP complete and deployed.** Analyze, generate, and voice profile features all working in production.
- **Analysis history** recently added — localStorage-backed, last 10 analyses with restore.
- **Voice profiles** stored in browser localStorage (no auth in MVP).
- **PostgreSQL** used for usage analytics only, not user data.
- **PostHog** integrated for product analytics.
- **Security:** Rate limiting (slowapi), request size limits (500KB), security headers, prompt security tests.
- **Latest task:** Analysis history + result persistence (TASK-SPEC.md).

## Known Issues

- No frontend unit tests — only build check and lint.
- No auth system — all data in localStorage (MVP scope).
- Frontend `.next` Docker cache can cause stale component errors (see Local Dev section).
- `date-fns` is NOT a dependency — use inline time formatting helpers.

## Conventions

- **Monorepo:** Single `.env` file in root for all services.
- **ESLint 9 flat config** — `eslint.config.mjs`, never `.eslintrc`.
- **PostHog** — initialized in `instrumentation-client.ts`, proxied through `/ingest` rewrites.
- **Scoring:** Six categories with weights — Inclusivity (25%), Readability (20%), Structure (15%), Completeness (15%), Voice Match (15%), Clarity (10%).
- **API endpoints:** `POST /api/analyze`, `POST /api/generate`, `POST /api/voice/extract`, `GET /health`.
- **Git:** Push to `main` triggers deploy. Remote: `git@github.com:ktsarnakliyski/JobSpresso.git`.
- **UI components:** Custom primitives in `frontend/src/components/ui/` (no component library).
- **Backend patterns:** Pydantic models, service layer, router layer, prompt templates separated.

## Ecosystem Conventions
This project is part of the OpenClaw ecosystem. If making changes that touch notifications, cron jobs, task board integration, or shared scripts, read the conventions file in the infrastructure repo:
- **Repo:** github.com/clawdex/clawd
- **File:** `CONVENTIONS.md`
- Key rules: use notify.py for notifications, taskWorker functions for task board, cron-lockrun.sh for cron jobs, check 1Password for secrets.
