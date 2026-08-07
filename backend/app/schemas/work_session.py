from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional

class WorkSessionCreate(BaseModel):
    title: str
    description: Optional[str] = None
    duration_minutes: int
    mood: Optional[str] = None
    project_id: Optional[UUID] = None

class WorkSessionUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    duration_minutes: Optional[int] = None
    mood: Optional[str] = None

class WorkSessionResponse(BaseModel):
    id: UUID
    user_id: UUID
    project_id: Optional[UUID]
    title: str
    description: Optional[str]
    duration_minutes: int
    mood: Optional[str]
    session_date: datetime
    created_at: datetime

    class Config:
        from_attributes = True