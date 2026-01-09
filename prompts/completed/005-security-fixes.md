---
execution: sequential
depends_on: []
---

<objective>
Implement critical security fixes for the JobSpresso application focusing on:
1. Rate limiting on API endpoints (prevent DoS and cost attacks)
2. Debug mode default to False (prevent stack trace exposure in production)

Do NOT rotate the API key - the user will handle that separately.
</objective>

<context>
Read CLAUDE.md for project conventions.

<security_audit_findings>
From ./analyses/004-security-audit.md:
- C2: No rate limiting on any endpoint - enables DoS and API cost attacks
- C3: Debug mode defaults to True in config.py - exposes stack traces
- H3: CORS configuration is overly permissive (allow_methods=["*"])
- H4: Exception details exposed to client in error responses
- M2: Missing security headers (X-Content-Type-Options, X-Frame-Options, etc.)
- M4: CORS origins hardcoded for dev only
</security_audit_findings>

<files_to_modify>
- ./backend/app/main.py - Add rate limiting middleware, security headers, fix CORS
- ./backend/app/config.py - Change debug default, add cors_origins config
- ./backend/app/routers/analyze.py - Add rate limits, improve error handling
- ./backend/app/routers/generate.py - Add rate limits, improve error handling
- ./backend/app/routers/voice.py - Add rate limits, improve error handling
- ./backend/requirements.txt - Add slowapi dependency
</files_to_modify>
</context>

<requirements>
<functional>
1. Add rate limiting using slowapi:
   - /api/analyze: 10 requests/minute per IP
   - /api/generate: 10 requests/minute per IP
   - /api/voice/extract: 5 requests/minute per IP
   - Return 429 status with clear error message when rate exceeded

2. Fix debug mode:
   - Default to False in config.py
   - Allow override via DEBUG environment variable

3. Fix CORS configuration:
   - Make origins configurable via CORS_ORIGINS environment variable
   - Default to localhost for development
   - Restrict methods to actual methods used: GET, POST, OPTIONS
   - Restrict headers to actual headers needed

4. Add security headers middleware:
   - X-Content-Type-Options: nosniff
   - X-Frame-Options: DENY
   - X-XSS-Protection: 1; mode=block
   - Referrer-Policy: strict-origin-when-cross-origin

5. Fix error handling in routers:
   - Log full exception details server-side
   - Return generic error messages to client
   - Keep specific validation errors (400) but sanitize 500 errors
</functional>

<quality>
- All existing tests must pass
- Rate limiting must not break development workflow
- Error messages must be helpful for debugging but not expose internals
</quality>
</requirements>

<implementation_guide>
<step_1>
Add slowapi to requirements.txt:
```
slowapi==0.1.9
```
</step_1>

<step_2>
Update config.py:
```python
class Settings(BaseSettings):
    debug: bool = False  # Changed from True
    cors_origins: str = "http://localhost:3100"  # Comma-separated for multiple
    # ... rest unchanged
```
</step_2>

<step_3>
Update main.py with rate limiting and security headers:
```python
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from starlette.middleware.base import BaseHTTPMiddleware

limiter = Limiter(key_func=get_remote_address)

# Security headers middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response

# Rate limit exception handler
@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request, exc):
    return JSONResponse(
        status_code=429,
        content={"detail": "Rate limit exceeded. Please try again later."}
    )

# Configure CORS with env-based origins
origins = settings.cors_origins.split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
    allow_credentials=True,
)

app.add_middleware(SecurityHeadersMiddleware)
app.state.limiter = limiter
```
</step_3>

<step_4>
Update routers with rate limits and safe error handling:
```python
import logging
from slowapi import Limiter
from slowapi.util import get_remote_address

logger = logging.getLogger(__name__)
limiter = Limiter(key_func=get_remote_address)

@router.post("/api/analyze")
@limiter.limit("10/minute")
async def analyze_jd(request: Request, ...):
    try:
        # ... existing logic
    except ValueError as e:
        # Validation errors - safe to expose
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Analysis failed")
        raise HTTPException(status_code=500, detail="Analysis failed. Please try again.")
```
</step_4>
</implementation_guide>

<verification>
1. Run backend tests: `cd backend && pytest`
2. Test rate limiting manually:
   - Make 11 rapid requests to /api/analyze
   - Verify 11th returns 429
3. Test error handling:
   - Trigger an error and verify generic message returned
   - Check server logs contain full details
4. Verify CORS headers in browser dev tools
5. Verify security headers in response
</verification>

<success_criteria>
- Rate limiting active on all expensive endpoints
- Debug mode defaults to False
- CORS properly restricted
- Security headers present in all responses
- Error messages safe for production
- All tests passing
</success_criteria>
