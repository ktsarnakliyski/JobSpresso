from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from slowapi.errors import RateLimitExceeded

from app.config import get_settings
from app.rate_limit import limiter
from app.routers import analyze, generate, voice

settings = get_settings()


# Security headers middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response


# Request body size limit middleware (prevents DoS and cost attacks)
class RequestSizeLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_size: int = 500_000):  # 500KB default
        super().__init__(app)
        self.max_size = max_size

    async def dispatch(self, request: Request, call_next):
        if request.headers.get("content-length"):
            content_length = int(request.headers["content-length"])
            if content_length > self.max_size:
                return JSONResponse(
                    status_code=413,
                    content={"detail": f"Request too large. Maximum size: {self.max_size // 1000}KB"}
                )
        return await call_next(request)


app = FastAPI(
    title=settings.app_name,
    debug=settings.debug,
)

# Store limiter in app state for routers to access
app.state.limiter = limiter


# Rate limit exception handler
@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": "Rate limit exceeded. Please try again later."}
    )


# Configure CORS with env-based origins
origins = [origin.strip() for origin in settings.cors_origins.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)

# Add security headers middleware
app.add_middleware(SecurityHeadersMiddleware)

# Add request size limit middleware (500KB max)
app.add_middleware(RequestSizeLimitMiddleware, max_size=500_000)

# Include routers
app.include_router(analyze.router)
app.include_router(generate.router)
app.include_router(voice.router)


@app.get("/health")
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "app": settings.app_name}
