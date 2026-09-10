from sqlalchemy.orm import Session
from sqlalchemy import desc, or_
from typing import List, Optional
from fastapi import HTTPException, status

from app.models.daily_tracker import DailyTracker
from app.models.user import User
from app.schemas.daily_tracker import DailyTrackerCreate, DailyTrackerUpdate

def get_daily_trackers(
    db: Session,
    user_id: Optional[int] = None,
    task_date: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 300,
) -> List[DailyTracker]:
    query = db.query(DailyTracker)

    if user_id is not None:
        query = query.filter(DailyTracker.user_id == user_id)

    if task_date:
        query = query.filter(DailyTracker.task_date == task_date)

    if status and status != "ALL":
        query = query.filter(DailyTracker.status.ilike(f"%{status}%"))

    if search:
        s = f"%{search}%"
        query = query.filter(
            or_(
                DailyTracker.user_name.ilike(s),
                DailyTracker.phase_1.ilike(s),
                DailyTracker.phase_2.ilike(s),
                DailyTracker.status.ilike(s),
                DailyTracker.task_date.ilike(s),
            )
        )

    # Order by task_date descending, then user_name ascending
    return query.order_by(desc(DailyTracker.task_date), DailyTracker.user_name).offset(skip).limit(limit).all()

def get_daily_tracker(db: Session, tracker_id: int) -> Optional[DailyTracker]:
    return db.query(DailyTracker).filter(DailyTracker.id == tracker_id).first()

def create_daily_tracker(
    db: Session,
    tracker_in: DailyTrackerCreate,
    current_user: User,
) -> DailyTracker:
    # If user_id not provided, assign to current user
    target_user_id = current_user.id
    target_user_name = current_user.name

    # Admin can create on behalf of other users
    if tracker_in.user_id and current_user.role == "ADMIN":
        target_user = db.query(User).filter(User.id == tracker_in.user_id).first()
        if target_user:
            target_user_id = target_user.id
            target_user_name = target_user.name

    tracker = DailyTracker(
        user_id=target_user_id,
        user_name=target_user_name,
        task_date=tracker_in.task_date,
        phase_1=tracker_in.phase_1,
        phase_2=tracker_in.phase_2,
        status=tracker_in.status or "In-Progress",
    )
    db.add(tracker)
    db.commit()
    db.refresh(tracker)
    return tracker

def update_daily_tracker(
    db: Session,
    tracker_id: int,
    tracker_in: DailyTrackerUpdate,
    current_user: User,
) -> DailyTracker:
    tracker = db.query(DailyTracker).filter(DailyTracker.id == tracker_id).first()
    if not tracker:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Daily tracker entry not found",
        )

    # Permission check: user can only edit their own worklog entry, unless ADMIN
    is_owner = (tracker.user_id == current_user.id) or (
        tracker.user_name.lower().strip() == current_user.name.lower().strip()
    )
    is_admin = current_user.role == "ADMIN"

    if not is_owner and not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied: You can only update your own daily worklog entries. Others' entries are view-only.",
        )

    update_data = tracker_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(tracker, field, val)

    db.commit()
    db.refresh(tracker)
    return tracker

def delete_daily_tracker(
    db: Session,
    tracker_id: int,
    current_user: User,
) -> bool:
    tracker = db.query(DailyTracker).filter(DailyTracker.id == tracker_id).first()
    if not tracker:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Daily tracker entry not found",
        )

    is_owner = (tracker.user_id == current_user.id) or (
        tracker.user_name.lower().strip() == current_user.name.lower().strip()
    )
    is_admin = current_user.role == "ADMIN"

    if not is_owner and not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied: You can only delete your own daily worklog entries.",
        )

    db.delete(tracker)
    db.commit()
    return True
