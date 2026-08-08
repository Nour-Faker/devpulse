from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from app.db.session import get_db
from app.models.work_session import WorkSession
from app.models.project import Project
from app.models.user import User
from app.core.security import get_current_user

router = APIRouter(prefix="/stats", tags=["stats"])

@router.get("/summary")
def get_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    total_sessions = db.query(WorkSession).filter(
        WorkSession.user_id == current_user.id
    ).count()

    total_minutes = db.query(func.sum(WorkSession.duration_minutes)).filter(
        WorkSession.user_id == current_user.id
    ).scalar() or 0

    active_projects = db.query(Project).filter(
        Project.user_id == current_user.id,
        Project.status == "active"
    ).count()

    # Last 7 days
    week_ago = datetime.utcnow() - timedelta(days=7)
    weekly_sessions = db.query(WorkSession).filter(
        WorkSession.user_id == current_user.id,
        WorkSession.created_at >= week_ago
    ).all()

    weekly_minutes = sum(s.duration_minutes for s in weekly_sessions)

    # Daily breakdown for chart (last 7 days)
    daily_data = []
    for i in range(6, -1, -1):
        day = datetime.utcnow() - timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day.replace(hour=23, minute=59, second=59)
        
        minutes = db.query(func.sum(WorkSession.duration_minutes)).filter(
            WorkSession.user_id == current_user.id,
            WorkSession.created_at >= day_start,
            WorkSession.created_at <= day_end
        ).scalar() or 0

        daily_data.append({
            "day": day.strftime("%a"),
            "minutes": minutes,
            "hours": round(minutes / 60, 1)
        })

    # Mood breakdown
    moods = db.query(
        WorkSession.mood,
        func.count(WorkSession.mood)
    ).filter(
        WorkSession.user_id == current_user.id
    ).group_by(WorkSession.mood).all()

    mood_data = [{"mood": m[0], "count": m[1]} for m in moods if m[0]]

    # Streak
    streak = 0
    check_day = datetime.utcnow().date()
    while True:
        day_start = datetime.combine(check_day, datetime.min.time())
        day_end = datetime.combine(check_day, datetime.max.time())
        count = db.query(WorkSession).filter(
            WorkSession.user_id == current_user.id,
            WorkSession.created_at >= day_start,
            WorkSession.created_at <= day_end
        ).count()
        if count == 0:
            break
        streak += 1
        check_day -= timedelta(days=1)

    return {
        "total_sessions": total_sessions,
        "total_hours": round(total_minutes / 60, 1),
        "total_minutes": total_minutes,
        "active_projects": active_projects,
        "weekly_hours": round(weekly_minutes / 60, 1),
        "weekly_sessions": len(weekly_sessions),
        "daily_data": daily_data,
        "mood_data": mood_data,
        "streak_days": streak
    }