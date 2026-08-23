import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from dotenv import load_dotenv

from database import init_db
from routes import auth_routes, patient_routes, scan_routes, admin_routes

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)

# Ensure upload directories exist
for d in ["uploads/mri_scans", "uploads/gradcam", "uploads/reports"]:
    os.makedirs(d, exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup/shutdown lifecycle hook."""
    logger.info("NeuroAssist API starting — initialising MongoDB collections & indexes …")
    await init_db()
    logger.info("Database ready.")
    yield
    logger.info("NeuroAssist API shutting down.")


app = FastAPI(
    title="NeuroAssist API",
    description="Enterprise AI Healthcare Platform — Neurological Screening & MRI Intelligence",
    version="3.0.0",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://vercel.app",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Static file serving (GradCAM / uploaded scans) ───────────────────────────
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth_routes.router)
app.include_router(patient_routes.router)
app.include_router(scan_routes.router)
app.include_router(admin_routes.router)


@app.get("/")
async def read_root():
    return {
        "status": "ok",
        "app": "NeuroAssist API",
        "version": "3.0.0",
        "database": "MongoDB Atlas (Motor async)",
        "inference": "PyTorch ResNet-10 + SimpleITK preprocessing",
    }


@app.get("/api/health")
async def health():
    return {"status": "healthy", "version": "3.0.0"}
