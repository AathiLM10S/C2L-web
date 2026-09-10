from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.schemas.user import UserOut

class QCIssueBase(BaseModel):
    sl_no: Optional[int] = None
    batch_no: Optional[str] = None
    batch_id: Optional[int] = None
    batch_owner_id: Optional[int] = None
    audit_id: Optional[int] = None
    issue_type: str
    remark: str
    proof_url: Optional[str] = None
    qc_checked_by_id: Optional[int] = None
    qc_date: str
    status: str = "OPEN"
    resolution_note: Optional[str] = None

class QCIssueCreate(BaseModel):
    sl_no: Optional[int] = None
    batch_no: Optional[str] = None
    batch_id: Optional[int] = None
    batch_owner_id: Optional[int] = None
    audit_id: Optional[int] = None
    issue_type: str
    remark: str
    proof_url: Optional[str] = None
    qc_date: str
    status: str = "OPEN"

class QCIssueUpdate(BaseModel):
    status: Optional[str] = None
    resolution_note: Optional[str] = None
    proof_url: Optional[str] = None
    remark: Optional[str] = None
    issue_type: Optional[str] = None

class QCIssueOut(QCIssueBase):
    id: int
    qc_checker: Optional[UserOut] = None
    batch_owner: Optional[UserOut] = None
    batch_owner_name: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
