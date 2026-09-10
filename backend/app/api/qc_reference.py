from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from sqlalchemy import desc, or_

from app.db.database import get_db
from app.models.user import User
from app.models.c2l_audit import C2LAudit
from app.models.c2l_batch import C2LBatch
from app.schemas.c2l_audit import C2LAuditOut, C2LAuditCreate, C2LAuditUpdate
from app.core.permissions import get_current_user, require_qc_reference_edit

router = APIRouter(prefix="/qc/reference", tags=["QC Reference"])

@router.get("", response_model=List[C2LAuditOut])
def list_qc_references(
    skip: int = 0,
    limit: int = 200,
    search: Optional[str] = None,
    batch_no: Optional[str] = None,
    qc_status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(C2LAudit)
    if batch_no:
        query = query.filter(C2LAudit.batch_no == batch_no)
    if qc_status and qc_status != "ALL":
        query = query.filter(C2LAudit.qc_status.ilike(f"%{qc_status}%"))
    if search:
        search_pat = f"%{search}%"
        query = query.filter(
            or_(
                C2LAudit.batch_no.ilike(search_pat),
                C2LAudit.remarks.ilike(search_pat),
                C2LAudit.sheet_metal_qc.ilike(search_pat)
            )
        )
    records = query.order_by(C2LAudit.id.asc()).offset(skip).limit(limit).all()
    results = []
    for r in records:
        out = C2LAuditOut.model_validate(r)
        if not out.batch_no and r.batch:
            out.batch_no = r.batch.batch_no
        results.append(out)
    return results

@router.post("", response_model=C2LAuditOut)
def create_qc_reference(
    ref_in: C2LAuditCreate,
    current_user: User = Depends(require_qc_reference_edit),
    db: Session = Depends(get_db)
):
    """Only Bash, Aathithya, Keerthana, and System Admin can create / edit QC Reference."""
    batch = db.query(C2LBatch).filter(C2LBatch.batch_no == ref_in.batch_no).first()
    
    max_sno = db.query(C2LAudit.sl_no).order_by(C2LAudit.sl_no.desc()).first()
    next_sno = (max_sno[0] + 1) if (max_sno and max_sno[0]) else 1

    entry = C2LAudit(
        sl_no=next_sno,
        batch_id=batch.id if batch else ref_in.batch_id,
        batch_no=ref_in.batch_no,
        batch_owner_id=ref_in.batch_owner_id or (batch.assigned_to_id if batch else None),
        audited_by_id=ref_in.audited_by_id or current_user.id,
        start_date=ref_in.start_date,
        end_date=ref_in.end_date,
        audit_date=ref_in.audit_date or ref_in.start_date,
        qc_status=ref_in.qc_status or "YES",
        audit_status=ref_in.audit_status or "YES",
        audit_result=ref_in.audit_result or "PASS",
        sheet_metal_qc=ref_in.sheet_metal_qc,
        remarks=ref_in.remarks
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return C2LAuditOut.model_validate(entry)

@router.put("/{ref_id}", response_model=C2LAuditOut)
def update_qc_reference(
    ref_id: int,
    ref_in: C2LAuditUpdate,
    current_user: User = Depends(require_qc_reference_edit),
    db: Session = Depends(get_db)
):
    """Only Bash, Aathithya, Keerthana, and System Admin can edit QC Reference."""
    entry = db.query(C2LAudit).filter(C2LAudit.id == ref_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="QC Reference record not found")
        
    for k, v in ref_in.model_dump(exclude_unset=True).items():
        setattr(entry, k, v)
        
    # If QC/Audit status is marked as PASS/YES, update master batch
    if entry.batch_id:
        batch = db.query(C2LBatch).filter(C2LBatch.id == entry.batch_id).first()
        if batch:
            if ref_in.audit_result == "PASS" or (entry.audit_status and entry.audit_status.upper() in ("YES", "PASSED")):
                batch.audit_status = "PASSED"
                batch.qc_status = "COMPLETED"
            elif ref_in.audit_result == "FAIL" or (entry.qc_status and entry.qc_status.lower() == "hold"):
                batch.audit_status = "FAILED"
                batch.qc_status = "ON_HOLD"
                
    db.commit()
    db.refresh(entry)
    return C2LAuditOut.model_validate(entry)
