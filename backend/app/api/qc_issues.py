from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from sqlalchemy import desc, or_

from app.db.database import get_db
from app.models.user import User
from app.models.qc_issue import QCIssue
from app.models.c2l_batch import C2LBatch
from app.schemas.qc_issue import QCIssueOut, QCIssueCreate, QCIssueUpdate
from app.core.permissions import require_qc_issues_access

router = APIRouter(prefix="/qc/issues", tags=["QC Issues"])

@router.get("", response_model=List[QCIssueOut])
def list_qc_issues(
    skip: int = 0,
    limit: int = 100,
    batch_id: Optional[int] = None,
    batch_no: Optional[str] = None,
    status: Optional[str] = None,
    issue_type: Optional[str] = None,
    search: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: User = Depends(require_qc_issues_access),
    db: Session = Depends(get_db)
):
    """
    Restricted: Only System Admin, Bash, Aathithya, and Keerthana can access / view QC Issues.
    """
    query = db.query(QCIssue)
    if batch_id:
        query = query.filter(QCIssue.batch_id == batch_id)
    if batch_no:
        query = query.filter(QCIssue.batch_no == batch_no)
    if status and status != "ALL":
        query = query.filter(QCIssue.status == status)
    if issue_type and issue_type != "ALL":
        query = query.filter(QCIssue.issue_type == issue_type)
    if search:
        search_pat = f"%{search}%"
        query = query.filter(
            or_(
                QCIssue.remark.ilike(search_pat),
                QCIssue.issue_type.ilike(search_pat),
                QCIssue.batch_no.ilike(search_pat)
            )
        )
    if start_date:
        query = query.filter(QCIssue.qc_date >= start_date)
    if end_date:
        query = query.filter(QCIssue.qc_date <= end_date)
        
    issues = query.order_by(desc(QCIssue.id)).offset(skip).limit(limit).all()
    results = []
    for q in issues:
        q_out = QCIssueOut.model_validate(q)
        if not q_out.batch_no and q.batch:
            q_out.batch_no = q.batch.batch_no
        if q.batch_owner:
            q_out.batch_owner_name = q.batch_owner.name
        elif q.batch and q.batch.assigned_to:
            q_out.batch_owner_name = q.batch.assigned_to.name
        results.append(q_out)
    return results

@router.post("", response_model=QCIssueOut)
def report_qc_issue(
    issue_in: QCIssueCreate,
    current_user: User = Depends(require_qc_issues_access),
    db: Session = Depends(get_db)
):
    """
    Restricted: Only System Admin, Bash, Aathithya, and Keerthana can create QC Issues.
    """
    target_batch = None
    if issue_in.batch_id:
        target_batch = db.query(C2LBatch).filter(C2LBatch.id == issue_in.batch_id).first()
    elif issue_in.batch_no:
        target_batch = db.query(C2LBatch).filter(C2LBatch.batch_no == issue_in.batch_no).first()

    batch_no_val = issue_in.batch_no or (target_batch.batch_no if target_batch else None)
    batch_owner_id_val = issue_in.batch_owner_id or (target_batch.assigned_to_id if target_batch else None)

    issue = QCIssue(
        sl_no=issue_in.sl_no,
        batch_id=target_batch.id if target_batch else issue_in.batch_id,
        batch_no=batch_no_val,
        batch_owner_id=batch_owner_id_val,
        audit_id=issue_in.audit_id,
        issue_type=issue_in.issue_type,
        remark=issue_in.remark,
        proof_url=issue_in.proof_url,
        qc_checked_by_id=current_user.id,
        qc_date=issue_in.qc_date,
        status=issue_in.status
    )
    db.add(issue)
    
    if target_batch and issue_in.status == "OPEN":
        target_batch.audit_status = "FAILED"
        target_batch.qc_status = "ON_HOLD"
        
    db.commit()
    db.refresh(issue)
    
    q_out = QCIssueOut.model_validate(issue)
    if not q_out.batch_no and issue.batch:
        q_out.batch_no = issue.batch.batch_no
    if issue.batch_owner:
        q_out.batch_owner_name = issue.batch_owner.name
    elif issue.batch and issue.batch.assigned_to:
        q_out.batch_owner_name = issue.batch.assigned_to.name
    return q_out

@router.put("/{issue_id}", response_model=QCIssueOut)
def update_issue_status(
    issue_id: int,
    issue_in: QCIssueUpdate,
    current_user: User = Depends(require_qc_issues_access),
    db: Session = Depends(get_db)
):
    """
    Restricted: Only System Admin, Bash, Aathithya, and Keerthana can update QC Issues.
    """
    issue = db.query(QCIssue).filter(QCIssue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="QC Issue not found")
    for k, v in issue_in.model_dump(exclude_unset=True).items():
        setattr(issue, k, v)
    db.commit()
    db.refresh(issue)
    
    q_out = QCIssueOut.model_validate(issue)
    if not q_out.batch_no and issue.batch:
        q_out.batch_no = issue.batch.batch_no
    if issue.batch_owner:
        q_out.batch_owner_name = issue.batch_owner.name
    elif issue.batch and issue.batch.assigned_to:
        q_out.batch_owner_name = issue.batch.assigned_to.name
    return q_out
