from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.session import engine, Base
from app.api.routes import auth, projects, sessions, stats, ai

Base.metadata.create_all(bind=engine)

app = FastAPI(title="DevPulse API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://devpulse-one-bice.vercel.app",
        "https://*.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(projects.router, prefix="/api/v1")
app.include_router(sessions.router, prefix="/api/v1")
app.include_router(stats.router, prefix="/api/v1")
app.include_router(ai.router, prefix="/api/v1")

@app.get("/")
def root():
    return {"message": "DevPulse API is running"}

@app.get("/health")
def health():
    return {"status": "ok"}