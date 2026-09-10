from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc
from app.models.c2l_batch import C2LBatch
from app.models.batch_work_log import C2LBatchWorkLog
from app.models.batch_co_assignment import BatchCoAssignment
from app.models.user import User
from app.schemas.c2l_batch import C2LBatchCreate, C2LBatchUpdate, WorkLogCreate

def get_batches(
    db: Session,
    skip: int = 0,
    limit: int = 200,
    search: Optional[str] = None,
    status: Optional[str] = None,
    batch_type: Optional[str] = None,
    assigned_to_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> List[C2LBatch]:
    query = db.query(C2LBatch)
    
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                C2LBatch.batch_no.ilike(search_pattern),
                C2LBatch.location.ilike(search_pattern),
                C2LBatch.complexity.ilike(search_pattern),
                C2LBatch.current_remarks.ilike(search_pattern)
            )
        )
    if status and status != "ALL":
        query = query.filter(C2LBatch.work_status == status)
    if batch_type and batch_type != "ALL":
        query = query.filter(C2LBatch.batch_type == batch_type)
    if assigned_to_id:
        # Check if primary assignee or co-assigned
        co_assigned_batch_ids = db.query(BatchCoAssignment.batch_id).filter(BatchCoAssignment.user_id == assigned_to_id)
        query = query.filter(
            or_(
                C2LBatch.assigned_to_id == assigned_to_id,
                C2LBatch.id.in_(co_assigned_batch_ids)
            )
        )
    if start_date:
        query = query.filter(C2LBatch.start_date >= start_date)
    if end_date:
        query = query.filter(C2LBatch.end_date <= end_date)

    return query.order_by(desc(C2LBatch.updated_at), desc(C2LBatch.id)).offset(skip).limit(limit).all()

def get_batch_by_id(db: Session, batch_id: int) -> Optional[C2LBatch]:
    return db.query(C2LBatch).filter(C2LBatch.id == batch_id).first()

def get_batch_by_no(db: Session, batch_no: str) -> Optional[C2LBatch]:
    return db.query(C2LBatch).filter(C2LBatch.batch_no == batch_no).first()

def get_completed_batches(
    db: Session,
    skip: int = 0,
    limit: int = 200,
    search: Optional[str] = None,
    assigned_to_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> List[C2LBatch]:
    """Client-Ready batches: Work status COMPLETED and Audit status PASSED"""
    query = db.query(C2LBatch).filter(
        and_(
            C2LBatch.work_status == "COMPLETED",
            C2LBatch.audit_status == "PASSED"
        )
    )
    if search:
        search_pat = f"%{search}%"
        query = query.filter(
            or_(
                C2LBatch.batch_no.ilike(search_pat),
                C2LBatch.location.ilike(search_pat)
            )
        )
    if assigned_to_id:
        query = query.filter(C2LBatch.assigned_to_id == assigned_to_id)
    if start_date:
        query = query.filter(C2LBatch.start_date >= start_date)
    if end_date:
        query = query.filter(C2LBatch.end_date <= end_date)

    return query.order_by(desc(C2LBatch.updated_at)).offset(skip).limit(limit).all()

def create_batch(db: Session, batch_in: C2LBatchCreate) -> C2LBatch:
    batch = C2LBatch(**batch_in.model_dump())
    db.add(batch)
    db.commit()
    db.refresh(batch)
    return batch

def update_batch(db: Session, batch_id: int, batch_in: C2LBatchUpdate) -> Optional[C2LBatch]:
    batch = get_batch_by_id(db, batch_id)
    if not batch:
        return None
    for field, value in batch_in.model_dump(exclude_unset=True).items():
        setattr(batch, field, value)
    db.commit()
    db.refresh(batch)
    return batch

def add_work_log(db: Session, batch_id: int, log_in: WorkLogCreate) -> C2LBatchWorkLog:
    work_log = C2LBatchWorkLog(batch_id=batch_id, **log_in.model_dump())
    db.add(work_log)
    db.commit()
    db.refresh(work_log)
    return work_log
