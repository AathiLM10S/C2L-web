from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_
from app.models.qc_issue import QCIssue
from app.models.c2l_batch import C2LBatch
from app.schemas.qc_issue import QCIssueCreate, QCIssueUpdate

def get_qc_issues(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    batch_id: Optional[int] = None,
    qc_checked_by_id: Optional[int] = None,
    status: Optional[str] = None,
    issue_type: Optional[str] = None,
    search: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
) -> List[QCIssue]:
    query = db.query(QCIssue)
    if batch_id:
        query = query.filter(QCIssue.batch_id == batch_id)
    if qc_checked_by_id:
        query = query.filter(QCIssue.qc_checked_by_id == qc_checked_by_id)
    if status and status != "ALL":
        query = query.filter(QCIssue.status == status)
    if issue_type and issue_type != "ALL":
        query = query.filter(QCIssue.issue_type == issue_type)
    if search:
        search_pat = f"%{search}%"
        query = query.filter(
            or_(
                QCIssue.remark.ilike(search_pat),
                QCIssue.issue_type.ilike(search_pat)
            )
        )
    if start_date:
        query = query.filter(QCIssue.qc_date >= start_date)
    if end_date:
        query = query.filter(QCIssue.qc_date <= end_date)
        
    return query.order_by(desc(QCIssue.id)).offset(skip).limit(limit).all()

def create_qc_issue(db: Session, issue_in: QCIssueCreate, checker_id: int) -> QCIssue:
    issue = QCIssue(
        batch_id=issue_in.batch_id,
        audit_id=issue_in.audit_id,
        issue_type=issue_in.issue_type,
        remark=issue_in.remark,
        proof_url=issue_in.proof_url,
        qc_checked_by_id=checker_id,
        qc_date=issue_in.qc_date,
        status=issue_in.status
    )
    db.add(issue)
    
    # Mark batch audit status as FAILED if open issue
    batch = db.query(C2LBatch).filter(C2LBatch.id == issue_in.batch_id).first()
    if batch and issue_in.status == "OPEN":
        batch.audit_status = "FAILED"
        batch.qc_status = "ON_HOLD"
        
    db.commit()
    db.refresh(issue)
    return issue

def update_qc_issue(db: Session, issue_id: int, issue_in: QCIssueUpdate) -> Optional[QCIssue]:
    issue = db.query(QCIssue).filter(QCIssue.id == issue_id).first()
    if not issue:
        return None
    for k, v in issue_in.model_dump(exclude_unset=True).items():
        setattr(issue, k, v)
    db.commit()
    db.refresh(issue)
    return issue
