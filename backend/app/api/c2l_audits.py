from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.database import get_db
from app.models.user import User
from app.models.c2l_audit import C2LAudit
from app.schemas.c2l_audit import C2LAuditOut, C2LAuditCreate
from app.core.permissions import require_admin_only
from app.models.c2l_batch import C2LBatch
from app.schemas.c2l_batch import C2LBatchOut
from app.services import audit_service

router = APIRouter(prefix="/c2l/audits", tags=["C2L Audits"])

@router.get("/pending-batches", response_model=List[C2LBatchOut])
def list_pending_audit_batches(
    current_user: User = Depends(require_admin_only),
    db: Session = Depends(get_db)
):
    """
    Whichever batches completed in C2L log and not mentioned in QC Reference
    are returned for the Audit Workspace.
    """
    qc_ref_batch_nos = {b[0] for b in db.query(C2LAudit.batch_no).all() if b[0]}
    
    completed_batches = (
        db.query(C2LBatch)
        .filter(C2LBatch.work_status == "COMPLETED")
        .order_by(C2LBatch.id.desc())
        .all()
    )
    
    pending = []
    for b in completed_batches:
        if b.batch_no not in qc_ref_batch_nos:
            b_out = C2LBatchOut.model_validate(b)
            b_out.is_client_ready = (b.work_status == "COMPLETED" and b.audit_status == "PASSED")
            pending.append(b_out)
            
    return pending

@router.get("", response_model=List[C2LAuditOut])
def list_audits(
    skip: int = 0,
    limit: int = 100,
    batch_id: Optional[int] = None,
    result: Optional[str] = None,
    current_user: User = Depends(require_admin_only),
    db: Session = Depends(get_db)
):
    """
    Audit Workspace is restricted ONLY to System Administrator.
    """
    audits = audit_service.get_audits(
        db=db,
        skip=skip,
        limit=limit,
        batch_id=batch_id,
        result=result
    )
    results = []
    for a in audits:
        a_out = C2LAuditOut.model_validate(a)
        if not a_out.batch_no and a.batch:
            a_out.batch_no = a.batch.batch_no
        results.append(a_out)
    return results

@router.post("", response_model=C2LAuditOut)
def record_audit(
    audit_in: C2LAuditCreate,
    current_user: User = Depends(require_admin_only),
    db: Session = Depends(get_db)
):
    """
    Audit recording in Audit Workspace is restricted ONLY to System Administrator.
    """
    audit = audit_service.create_audit(db, audit_in, current_user.id)
    a_out = C2LAuditOut.model_validate(audit)
    if not a_out.batch_no and audit.batch:
        a_out.batch_no = audit.batch.batch_no
    return a_out
