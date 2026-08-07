from fastapi import FastAPI
from app.db.session import engine, Base
from app.api.routes import auth, projects, sessions

Base.metadata.create_all(bind=engine)

app = FastAPI(title="DevPulse API", version="1.0.0")

app.include_router(auth.router, prefix="/api/v1")
app.include_router(projects.router, prefix="/api/v1")
app.include_router(sessions.router, prefix="/api/v1")

@app.get("/")
def root():
    return {"message": "DevPulse API is running"}

@app.get("/health")
def health():
    return {"status": "ok"}