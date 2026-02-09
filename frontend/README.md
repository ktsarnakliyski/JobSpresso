# JobSpresso Frontend

Next.js 16 application with TypeScript and Tailwind CSS.

## Development

```bash
# Install dependencies
npm install

# Start development server (port 3100)
npm run dev -- -p 3100

# Build for production
npm run build

# Run linting
npm run lint
```

## Project Structure

```
src/
├── app/
│   ├── page.tsx          # Home/landing page
│   ├── analyze/page.tsx  # JD analyzer
│   ├── generate/page.tsx # JD generator
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles + Tailwind
├── components/
│   ├── Input.tsx         # Shared input component
│   ├── ErrorCard.tsx     # Error display
│   ├── LoadingSpinner.tsx
│   └── CopyButton.tsx    # Clipboard copy
├── lib/
│   ├── api.ts            # Backend API client
│   └── utils.ts          # Utilities (cn, etc.)
└── types/
    └── voice.ts          # Voice profile types
```

## Environment Variables

The frontend uses a single environment variable set at build time:

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:8100` |

For development, this is set in `docker-compose.yml`.
For production, it's passed as a build arg in `docker-compose.prod.yml`.

## Docker

Development and production Dockerfiles:
- `Dockerfile` — Development with hot reload
- `Dockerfile.prod` — Multi-stage production build (standalone output)
