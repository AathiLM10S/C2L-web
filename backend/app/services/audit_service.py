from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models.c2l_audit import C2LAudit
from app.models.c2l_batch import C2LBatch
from app.schemas.c2l_audit import C2LAuditCreate

def get_audits(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    batch_id: Optional[int] = None,
    audited_by_id: Optional[int] = None,
    result: Optional[str] = None
) -> List[C2LAudit]:
    query = db.query(C2LAudit)
    if batch_id:
        query = query.filter(C2LAudit.batch_id == batch_id)
    if audited_by_id:
        query = query.filter(C2LAudit.audited_by_id == audited_by_id)
    if result and result != "ALL":
        query = query.filter(C2LAudit.audit_result == result)
    return query.order_by(desc(C2LAudit.id)).offset(skip).limit(limit).all()

def create_audit(db: Session, audit_in: C2LAuditCreate, auditor_id: int) -> C2LAudit:
    batch = db.query(C2LBatch).filter(C2LBatch.id == audit_in.batch_id).first()
    batch_no = batch.batch_no if batch else (audit_in.batch_no or str(audit_in.batch_id))
    
    max_sno = db.query(C2LAudit.sl_no).order_by(C2LAudit.sl_no.desc()).first()
    next_sno = (max_sno[0] + 1) if (max_sno and max_sno[0]) else 1

    audit = C2LAudit(
        sl_no=next_sno,
        batch_id=audit_in.batch_id,
        batch_no=batch_no,
        batch_owner_id=batch.assigned_to_id if batch else None,
        audited_by_id=auditor_id,
        start_date=batch.start_date if batch else None,
        end_date=batch.end_date if batch else None,
        audit_date=audit_in.audit_date,
        audit_result=audit_in.audit_result,
        audit_status="YES" if audit_in.audit_result == "PASS" else "NO",
        qc_status="YES" if audit_in.audit_result == "PASS" else ("HOLD" if audit_in.audit_result == "FAIL" else "PENDING"),
        sheet_metal_qc=audit_in.sheet_metal_qc,
        remarks=audit_in.remarks
    )
    db.add(audit)
    
    # Update master batch audit status accordingly
    if batch:
        if audit_in.audit_result == "PASS":
            batch.audit_status = "PASSED"
            batch.qc_status = "COMPLETED"
        elif audit_in.audit_result == "FAIL":
            batch.audit_status = "FAILED"
            batch.qc_status = "ON_HOLD"
        elif audit_in.audit_result == "RE_AUDIT":
            batch.audit_status = "RE_AUDIT"
            
    db.commit()
    db.refresh(audit)
    return audit
