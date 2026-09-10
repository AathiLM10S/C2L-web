from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.schemas.user import UserOut

class DailyTrackerBase(BaseModel):
    task_date: str
    phase_1: Optional[str] = None
    phase_2: Optional[str] = None
    status: Optional[str] = "In-Progress"

class DailyTrackerCreate(DailyTrackerBase):
    user_id: Optional[int] = None
    user_name: Optional[str] = None

class DailyTrackerUpdate(BaseModel):
    task_date: Optional[str] = None
    phase_1: Optional[str] = None
    phase_2: Optional[str] = None
    status: Optional[str] = None

class DailyTrackerOut(DailyTrackerBase):
    id: int
    user_id: Optional[int] = None
    user_name: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    user: Optional[UserOut] = None

    class Config:
        from_attributes = True
