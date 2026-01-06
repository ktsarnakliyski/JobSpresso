# JobSpresso

AI-powered job description analyzer and generator with customizable voice profiles for agency recruiters and HR professionals.

## Features

- **Analyze Job Descriptions** — Get detailed scoring across inclusivity, readability, structure, completeness, clarity, and voice match
- **Generate Job Descriptions** — Create polished JDs from job details with AI assistance
- **Voice Profiles** — Customize the tone and style (stored in browser localStorage)

## Tech Stack

- **Frontend:** Next.js 14 + TypeScript + Tailwind CSS
- **Backend:** FastAPI + Python 3.12
- **Database:** PostgreSQL 16
- **AI:** Claude API (Anthropic)
- **Deployment:** Docker + Caddy (reverse proxy with auto SSL)

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Anthropic API key

### Setup

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/JobSpresso.git
cd JobSpresso

# Create environment file
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

# Start all services
docker compose up
```

### Access

- **Frontend:** http://localhost:3100
- **Backend API:** http://localhost:8100
- **Health check:** http://localhost:8100/health

## Development

### Running Services Individually

```bash
# Frontend only
cd frontend && npm install && npm run dev -- -p 3100

# Backend only (requires virtual environment)
cd backend && pip install -r requirements.txt
uvicorn app.main:app --reload --port 8100

# Database only
docker compose up db
```

### Testing

```bash
# Backend tests
cd backend && pytest

# Frontend build check
cd frontend && npm run build
```

## Production Deployment

Deploy to a server with Docker and Caddy as reverse proxy:

```bash
# On server - create Caddy network (one-time)
docker network create caddy-network

# Clone and configure
git clone https://github.com/YOUR_USERNAME/JobSpresso.git /root/projects/jobspresso
cd /root/projects/jobspresso
cp .env.example .env
# Edit .env with production values (secure DB password, API key)

# Build and start
docker compose -f docker-compose.prod.yml up -d --build
```

Configure Caddy to proxy to the containers (see `Caddyfile.example`).

## Project Structure

```
JobSpresso/
├── frontend/           # Next.js app
│   ├── src/app/        # Pages (analyze, generate)
│   └── src/components/ # Shared components
├── backend/            # FastAPI app
│   ├── app/            # API routes and services
│   └── tests/          # Pytest tests
├── docker-compose.yml       # Development
├── docker-compose.prod.yml  # Production
└── Caddyfile.example        # Reverse proxy template
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Required. Your Claude API key |
| `DB_USER` | PostgreSQL username (default: jobspresso) |
| `DB_PASSWORD` | PostgreSQL password (default: jobspresso) |
| `DB_NAME` | PostgreSQL database name (default: jobspresso) |

## License

Private
