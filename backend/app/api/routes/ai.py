from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import requests
import json
from app.db.session import get_db
from app.models.work_session import WorkSession
from app.models.project import Project
from app.models.user import User
from app.core.security import get_current_user
from app.core.config import settings

router = APIRouter(prefix="/ai", tags=["ai"])

def call_groq(prompt: str) -> str:
    response = requests.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {settings.GROQ_API_KEY}",
            "Content-Type": "application/json",
        },
        json={
            "model": "llama-3.1-8b-instant",
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 200,
        },
        timeout=30,
    )
    data = response.json()
    if "choices" not in data:
        raise HTTPException(status_code=500, detail=f"Groq error: {data}")
    return data["choices"][0]["message"]["content"]

@router.get("/weekly-summary")
def weekly_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not settings.GROQ_API_KEY:
        raise HTTPException(status_code=400, detail="AI not configured")

    week_ago = datetime.utcnow() - timedelta(days=7)
    sessions = db.query(WorkSession).filter(
        WorkSession.user_id == current_user.id,
        WorkSession.created_at >= week_ago
    ).all()

    projects = db.query(Project).filter(
        Project.user_id == current_user.id
    ).all()

    if not sessions:
        return {"summary": "No sessions logged this week. Start tracking your work to get AI insights!"}

    total_minutes = sum(s.duration_minutes for s in sessions)
    mood_counts: dict = {}
    for s in sessions:
        if s.mood:
            mood_counts[s.mood] = mood_counts.get(s.mood, 0) + 1

    session_list = "\n".join([
        f"- {s.title} ({s.duration_minutes}min, mood: {s.mood})"
        for s in sessions
    ])

    prompt = f"""You are a productivity coach analyzing a developer's work week.

Developer: {current_user.full_name}
Total sessions this week: {len(sessions)}
Total time: {round(total_minutes / 60, 1)} hours
Mood distribution: {mood_counts}
Active projects: {len(projects)}

Sessions logged:
{session_list}

Write a brief, encouraging weekly summary (3-4 sentences) that:
1. Highlights their achievements
2. Notes their mood patterns
3. Gives one specific actionable tip for next week
Keep it personal, concise, and motivating."""

    summary = call_groq(prompt)
    return {"summary": summary}


@router.get("/suggest-title")
def suggest_title(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not settings.GROQ_API_KEY:
        raise HTTPException(status_code=400, detail="AI not configured")

    recent = db.query(WorkSession).filter(
        WorkSession.user_id == current_user.id
    ).order_by(WorkSession.created_at.desc()).limit(10).all()

    if not recent:
        return {"suggestions": ["Built new feature", "Fixed bugs", "Code review", "Writing tests", "System design"]}

    titles = [s.title for s in recent]
    prompt = f"""Based on these recent work session titles from a developer:
{chr(10).join(f'- {t}' for t in titles)}

Suggest 5 short, specific session titles they might use next.
Return ONLY a JSON array of strings, nothing else. Example: ["Title 1", "Title 2"]"""

    text = call_groq(prompt).strip()
    try:
        suggestions = json.loads(text)
    except:
        suggestions = ["Built new feature", "Fixed bugs", "Code review", "Writing tests"]

    return {"suggestions": suggestions}