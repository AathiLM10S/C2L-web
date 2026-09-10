from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional

from app.db.database import get_db
from app.models.user import User
from app.core.permissions import get_current_user, require_roles
from app.services import report_service

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/excel")
def download_excel_report(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    status: Optional[str] = None,
    batch_type: Optional[str] = None,
    assigned_to_id: Optional[int] = None,
    current_user: User = Depends(require_roles("ADMIN", "MANAGER", "BU_HEAD", "LEAD")),
    db: Session = Depends(get_db)
):
    stream = report_service.generate_report_excel(
        db=db,
        start_date=start_date,
        end_date=end_date,
        status=status,
        batch_type=batch_type,
        assigned_to_id=assigned_to_id
    )
    filename = f"C2L_Report_{start_date or 'all'}_to_{end_date or 'all'}.xlsx"
    return StreamingResponse(
        stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/csv")
def download_csv_report(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    status: Optional[str] = None,
    batch_type: Optional[str] = None,
    assigned_to_id: Optional[int] = None,
    current_user: User = Depends(require_roles("ADMIN", "MANAGER", "BU_HEAD", "LEAD")),
    db: Session = Depends(get_db)
):
    stream = report_service.generate_report_csv(
        db=db,
        start_date=start_date,
        end_date=end_date,
        status=status,
        batch_type=batch_type,
        assigned_to_id=assigned_to_id
    )
    filename = f"C2L_Report_{start_date or 'all'}_to_{end_date or 'all'}.csv"
    return StreamingResponse(
        iter([stream.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
