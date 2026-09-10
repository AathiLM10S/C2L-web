from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from sqlalchemy import or_
from app.db.database import get_db
from app.models.user import User
from app.models.c2l_batch import C2LBatch
from app.models.batch_work_log import C2LBatchWorkLog
from app.models.c2l_audit import C2LAudit
from app.models.batch_co_assignment import BatchCoAssignment
from app.schemas.c2l_batch import (
    C2LBatchOut, C2LBatchDetailOut, C2LBatchCreate, C2LBatchUpdate, 
    WorkLogOut, WorkLogCreate
)
from app.core.permissions import get_current_user, require_roles
from app.services import c2l_service

router = APIRouter(prefix="/c2l", tags=["C2L Batches"])

@router.get("/batches", response_model=List[C2LBatchOut])
def get_all_batches(
    skip: int = 0,
    limit: int = 300,
    search: Optional[str] = None,
    status: Optional[str] = None,
    batch_type: Optional[str] = None,
    assigned_to_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    batches = c2l_service.get_batches(
        db=db,
        skip=skip,
        limit=limit,
        search=search,
        status=status,
        batch_type=batch_type,
        assigned_to_id=assigned_to_id,
        start_date=start_date,
        end_date=end_date
    )
    results = []
    for b in batches:
        b_out = C2LBatchOut.model_validate(b)
        b_out.is_client_ready = (b.work_status == "COMPLETED" and b.audit_status == "PASSED")
        results.append(b_out)
    return results

@router.get("/my-batches", response_model=List[C2LBatchOut])
def get_my_batches(
    skip: int = 0,
    limit: int = 200,
    status: Optional[str] = None,
    batch_type: Optional[str] = None,
    search: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    batches = c2l_service.get_batches(
        db=db,
        skip=skip,
        limit=limit,
        search=search,
        status=status,
        batch_type=batch_type,
        assigned_to_id=current_user.id,
        start_date=start_date,
        end_date=end_date
    )
    results = []
    for b in batches:
        b_out = C2LBatchOut.model_validate(b)
        b_out.is_client_ready = (b.work_status == "COMPLETED" and b.audit_status == "PASSED")
        results.append(b_out)
    return results

@router.get("/completed", response_model=List[C2LBatchOut])
def get_completed_client_ready_batches(
    skip: int = 0,
    limit: int = 200,
    search: Optional[str] = None,
    assigned_to_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    batches = c2l_service.get_completed_batches(
        db=db,
        skip=skip,
        limit=limit,
        search=search,
        assigned_to_id=assigned_to_id,
        start_date=start_date,
        end_date=end_date
    )
    results = []
    for b in batches:
        b_out = C2LBatchOut.model_validate(b)
        b_out.is_client_ready = True
        results.append(b_out)
    return results

@router.get("/batches/{batch_id}", response_model=C2LBatchDetailOut)
def get_batch_detail(
    batch_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    batch = c2l_service.get_batch_by_id(db, batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    b_out = C2LBatchDetailOut.model_validate(batch)
    b_out.is_client_ready = (batch.work_status == "COMPLETED" and batch.audit_status == "PASSED")
    return b_out

def check_can_manage_batch(user: User):
    name_lower = (user.name or "").lower().strip()
    email_lower = (user.email or "").lower().strip()
    is_admin_or_lead = user.role in ["ADMIN", "LEAD"]
    is_bash = "bash" in name_lower or email_lower in ["jothibash.n@solidpro-es.com", "jothi.bash@c2l-qc.com"]
    is_admin = user.role == "ADMIN" or email_lower in ["dharunkumar.j@solidpro-es.com", "admin@c2l-qc.com"]
    if not (is_admin_or_lead or is_bash or is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied: Batch status updates and batch creation are restricted to Admin, Lead, and Jothi Bash."
        )

@router.post("/batches", response_model=C2LBatchOut)
def create_new_batch(
    batch_in: C2LBatchCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Batch creation is restricted to Admin, Lead, and Jothi Bash."""
    check_can_manage_batch(current_user)

    if not batch_in.assigned_to_id:
        batch_in.assigned_to_id = current_user.id

    batch = c2l_service.create_batch(db, batch_in)
    
    # If starting work immediately, add initial work log
    work_log = c2l_service.add_work_log(
        db, 
        batch.id, 
        WorkLogCreate(
            assigned_to_id=current_user.id,
            work_type="New",
            start_date=batch.start_date or datetime.now().strftime("%Y-%m-%d"),
            end_date=batch.end_date,
            total_hours=batch.total_hours,
            status=batch.work_status,
            remarks=batch.current_remarks
        )
    )

    b_out = C2LBatchOut.model_validate(batch)
    b_out.is_client_ready = (batch.work_status == "COMPLETED" and batch.audit_status == "PASSED")
    return b_out

@router.put("/batches/{batch_id}", response_model=C2LBatchOut)
def update_batch_info(
    batch_id: int,
    batch_in: C2LBatchUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Batch status editing is restricted to Admin, Lead, and Jothi Bash."""
    check_can_manage_batch(current_user)

    batch = c2l_service.update_batch(db, batch_id, batch_in)
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    b_out = C2LBatchOut.model_validate(batch)
    b_out.is_client_ready = (batch.work_status == "COMPLETED" and batch.audit_status == "PASSED")
    return b_out

@router.post("/batches/{batch_id}/work-logs", response_model=WorkLogOut)
def add_batch_work_log(
    batch_id: int,
    log_in: WorkLogCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    batch = c2l_service.get_batch_by_id(db, batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
        
    if not log_in.assigned_to_id:
        log_in.assigned_to_id = current_user.id
        
    work_log = c2l_service.add_work_log(db, batch_id, log_in)
    
    # Update master batch status & hours based on work log
    if log_in.status:
        batch.work_status = log_in.status
    if log_in.total_hours:
        batch.total_hours = (batch.total_hours or 0) + log_in.total_hours
    if log_in.end_date and not batch.end_date:
        batch.end_date = log_in.end_date
    if log_in.remarks:
        batch.current_remarks = log_in.remarks
    db.commit()

    return WorkLogOut.model_validate(work_log)


@router.get("/work-logs", response_model=List[WorkLogOut])
def get_all_work_logs(
    skip: int = 0,
    limit: int = 400,
    search: Optional[str] = None,
    status: Optional[str] = None,
    assigned_to_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(C2LBatchWorkLog).join(C2LBatch, C2LBatchWorkLog.batch_id == C2LBatch.id)
    if status and status != "ALL":
        query = query.filter(C2LBatchWorkLog.status == status)
    if assigned_to_id:
        query = query.filter(C2LBatchWorkLog.assigned_to_id == assigned_to_id)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                C2LBatch.batch_no.ilike(search_pattern),
                C2LBatchWorkLog.remarks.ilike(search_pattern),
                C2LBatchWorkLog.work_type.ilike(search_pattern)
            )
        )
    logs = query.order_by(C2LBatchWorkLog.sl_no.asc().nullslast(), C2LBatchWorkLog.id.asc()).offset(skip).limit(limit).all()
    results = []
    for l in logs:
        l_out = WorkLogOut.model_validate(l)
        if l.batch:
            l_out.batch_no = l.batch.batch_no
            l_out.batch_type = l.batch.batch_type
            l_out.location = l.batch.location
        results.append(l_out)
    return results

