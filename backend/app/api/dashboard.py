from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import User
from app.schemas.dashboard import UserDashboardOut
from app.core.permissions import get_current_user
from app.services import dashboard_service

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("", response_model=UserDashboardOut)
def get_user_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns role-aware dynamic dashboard KPIs, recent batches, and QC issues
    calculated directly from the database for the authenticated user.
    """
    return dashboard_service.get_dashboard_data(db=db, current_user=current_user)
