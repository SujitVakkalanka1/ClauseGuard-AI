from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from app.api.routes import router as api_router

from sqlalchemy import text

# Ensure database tables and new columns exist on startup
Base.metadata.create_all(bind=engine)

def ensure_columns_exist():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE clauses ADD COLUMN line_number INTEGER;"))
            conn.commit()
        except Exception:
            pass
        try:
            conn.execute(text("ALTER TABLE clauses ADD COLUMN topic VARCHAR(255);"))
            conn.commit()
        except Exception:
            pass

ensure_columns_exist()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="SaaS Legal Contract Clause Risk Tagger API"
)

# Enable CORS for Next.js frontend dev & production with secure origin matching
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app",  # Secure regex for Vercel preview & production deployments
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


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
