import time
from collections import defaultdict
from fastapi import FastAPI, Request, Response, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from app.api.routes import router as api_router

from sqlalchemy import text

# Ensure database tables exist on startup
Base.metadata.create_all(bind=engine)

def ensure_columns_exist():
    with engine.connect() as conn:
        with conn.begin():
            try:
                conn.execute(text("ALTER TABLE clauses ADD COLUMN line_number INTEGER;"))
            except Exception:
                pass
            try:
                conn.execute(text("ALTER TABLE clauses ADD COLUMN topic VARCHAR(255);"))
            except Exception:
                pass

ensure_columns_exist()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="SaaS Legal Contract Clause Risk Tagger API",
    docs_url="/docs",
    redoc_url=None
)

# 1. Enable CORS with secure origin validation
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app",  # Secure regex for Vercel preview & production deployments
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# 2. In-Memory Sliding Window Rate Limiter Middleware (Max 60 requests per minute per IP)
RATE_LIMIT_MAX_REQUESTS = 60
RATE_LIMIT_WINDOW_SECONDS = 60
request_history: dict[str, list[float]] = defaultdict(list)

@app.middleware("http")
async def rate_limit_and_security_headers_middleware(request: Request, call_next):
    # Apply Rate Limiting to API routes
    client_ip = request.client.host if request.client else "127.0.0.1"
    now = time.time()

    # Clean old requests outside window
    timestamps = [ts for ts in request_history[client_ip] if now - ts < RATE_LIMIT_WINDOW_SECONDS]
    request_history[client_ip] = timestamps

    if len(timestamps) >= RATE_LIMIT_MAX_REQUESTS:
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={"detail": "Too many requests. Please slow down and try again shortly."}
        )

    timestamps.append(now)

    # Process HTTP request
    response: Response = await call_next(request)

    # 3. Inject HTTP Security Hardening Headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), camera=(), microphone=()"

    return response

# Mount API routes under /api
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "status": "online",
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs_url": "/docs"
    }
