from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.database import get_db
from app.models.user import User
from app.schemas.daily_tracker import DailyTrackerOut, DailyTrackerCreate, DailyTrackerUpdate
from app.core.permissions import get_current_user
from app.services import daily_tracker_service

router = APIRouter(prefix="/c2l/daily-tracker", tags=["C2L Daily Tracker"])

@router.get("", response_model=List[DailyTrackerOut])
def list_daily_trackers(
    user_id: Optional[int] = None,
    task_date: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 300,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    List all daily task updates.
    All authenticated users can view everyone's daily updates.
    """
    trackers = daily_tracker_service.get_daily_trackers(
        db=db,
        user_id=user_id,
        task_date=task_date,
        status=status,
        search=search,
        skip=skip,
        limit=limit,
    )
    return [DailyTrackerOut.model_validate(t) for t in trackers]

@router.get("/{tracker_id}", response_model=DailyTrackerOut)
def get_daily_tracker(
    tracker_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tracker = daily_tracker_service.get_daily_tracker(db, tracker_id)
    if not tracker:
        raise HTTPException(status_code=404, detail="Daily tracker entry not found")
    return DailyTrackerOut.model_validate(tracker)

@router.post("", response_model=DailyTrackerOut)
def create_daily_tracker(
    tracker_in: DailyTrackerCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Log a daily task update. By default assigned to current logged in user.
    """
    tracker = daily_tracker_service.create_daily_tracker(
        db=db,
        tracker_in=tracker_in,
        current_user=current_user,
    )
    return DailyTrackerOut.model_validate(tracker)

@router.put("/{tracker_id}", response_model=DailyTrackerOut)
def update_daily_tracker(
    tracker_id: int,
    tracker_in: DailyTrackerUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update a daily task update.
    Users can only update their own records. Others' records are view-only.
    """
    tracker = daily_tracker_service.update_daily_tracker(
        db=db,
        tracker_id=tracker_id,
        tracker_in=tracker_in,
        current_user=current_user,
    )
    return DailyTrackerOut.model_validate(tracker)

@router.delete("/{tracker_id}")
def delete_daily_tracker(
    tracker_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Delete a daily task update.
    Users can only delete their own records.
    """
    daily_tracker_service.delete_daily_tracker(
        db=db,
        tracker_id=tracker_id,
        current_user=current_user,
    )
    return {"message": "Daily tracker entry deleted successfully"}
