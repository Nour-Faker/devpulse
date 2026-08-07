from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.models.work_session import WorkSession
from app.models.user import User
from app.schemas.work_session import WorkSessionCreate, WorkSessionUpdate, WorkSessionResponse
from app.core.security import get_current_user

router = APIRouter(prefix="/sessions", tags=["sessions"])

@router.post("", response_model=WorkSessionResponse)
def create_session(
    session_in: WorkSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session = WorkSession(**session_in.model_dump(), user_id=current_user.id)
    db.add(session)
    db.commit()
    db.refresh(session)
    return session

@router.get("", response_model=List[WorkSessionResponse])
def list_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(WorkSession).filter(WorkSession.user_id == current_user.id).all()

@router.get("/{session_id}", response_model=WorkSessionResponse)
def get_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session = db.query(WorkSession).filter(
        WorkSession.id == session_id,
        WorkSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

@router.put("/{session_id}", response_model=WorkSessionResponse)
def update_session(
    session_id: str,
    session_in: WorkSessionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session = db.query(WorkSession).filter(
        WorkSession.id == session_id,
        WorkSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    for key, value in session_in.model_dump(exclude_unset=True).items():
        setattr(session, key, value)
    db.commit()
    db.refresh(session)
    return session

@router.delete("/{session_id}")
def delete_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session = db.query(WorkSession).filter(
        WorkSession.id == session_id,
        WorkSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    db.delete(session)
    db.commit()
    return {"message": "Session deleted"}