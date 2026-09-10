from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.db.database import Base, engine, SessionLocal
import app.models  # Ensure all SQLAlchemy models are registered
from app.services.csv_import_service import import_all_csv_data

from app.api.auth import router as auth_router
from app.api.c2l_batches import router as batches_router
from app.api.c2l_audits import router as audits_router
from app.api.qc_issues import router as qc_router
from app.api.c2l_scenarios import router as scenarios_router
from app.api.dashboard import router as dashboard_router
from app.api.reports import router as reports_router
from app.api.imports import router as imports_router
from app.api.qc_reference import router as qc_reference_router
from app.api.daily_tracker import router as daily_tracker_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables if not exist
    Base.metadata.create_all(bind=engine)
    
    # Auto-seed database from CSV datasets on startup if empty
    db = SessionLocal()
    try:
        from app.models.user import User
        if db.query(User).count() == 0:
            print("Auto-seeding database from CSV datasets...")
            res = import_all_csv_data(db)
            print(f"Seeding completed: {res}")
    finally:
        db.close()
        
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan
)

# CORS setup for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(batches_router, prefix=settings.API_V1_STR)
app.include_router(audits_router, prefix=settings.API_V1_STR)
app.include_router(qc_router, prefix=settings.API_V1_STR)
app.include_router(scenarios_router, prefix=settings.API_V1_STR)
app.include_router(dashboard_router, prefix=settings.API_V1_STR)
app.include_router(reports_router, prefix=settings.API_V1_STR)
app.include_router(imports_router, prefix=settings.API_V1_STR)
app.include_router(qc_reference_router, prefix=settings.API_V1_STR)
app.include_router(daily_tracker_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "app": settings.PROJECT_NAME,
        "status": "operational",
        "docs": f"{settings.API_V1_STR}/docs"
    }
