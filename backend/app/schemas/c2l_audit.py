from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.schemas.user import UserOut

class C2LAuditBase(BaseModel):
    sl_no: Optional[int] = None
    batch_id: Optional[int] = None
    batch_no: str
    batch_owner_id: Optional[int] = None
    audited_by_id: Optional[int] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    audit_date: Optional[str] = None
    qc_status: Optional[str] = "YES"
    audit_status: Optional[str] = "YES"
    audit_result: Optional[str] = "PASS"
    sheet_metal_qc: Optional[str] = None
    remarks: Optional[str] = None

class C2LAuditCreate(BaseModel):
    batch_no: str
    batch_id: Optional[int] = None
    batch_owner_id: Optional[int] = None
    audited_by_id: Optional[int] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    audit_date: Optional[str] = None
    qc_status: Optional[str] = "YES"
    audit_status: Optional[str] = "YES"
    audit_result: Optional[str] = "PASS"
    sheet_metal_qc: Optional[str] = None
    remarks: Optional[str] = None

class C2LAuditUpdate(BaseModel):
    batch_owner_id: Optional[int] = None
    audited_by_id: Optional[int] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    audit_date: Optional[str] = None
    qc_status: Optional[str] = None
    audit_status: Optional[str] = None
    audit_result: Optional[str] = None
    sheet_metal_qc: Optional[str] = None
    remarks: Optional[str] = None

class C2LAuditOut(C2LAuditBase):
    id: int
    auditor: Optional[UserOut] = None
    batch_owner: Optional[UserOut] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
