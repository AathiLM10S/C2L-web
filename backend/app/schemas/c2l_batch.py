from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.schemas.user import UserOut

class WorkLogBase(BaseModel):
    sl_no: Optional[int] = None
    assigned_to_id: Optional[int] = None
    work_type: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    total_hours: Optional[float] = None
    status: str = "YET_TO_START"
    qc_status: str = "YET_TO_START"
    qc_by_id: Optional[int] = None
    remarks: Optional[str] = None

class WorkLogCreate(WorkLogBase):
    pass

class WorkLogOut(WorkLogBase):
    id: int
    batch_id: int
    batch_no: Optional[str] = None
    batch_type: Optional[str] = None
    location: Optional[str] = None
    employee: Optional[UserOut] = None
    qc_reviewer: Optional[UserOut] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class CoAssignmentOut(BaseModel):
    id: int
    user_id: int
    role_note: Optional[str] = None
    user: Optional[UserOut] = None

    class Config:
        from_attributes = True

class C2LBatchBase(BaseModel):
    batch_no: str
    batch_type: Optional[str] = None
    location: Optional[str] = None
    complexity: Optional[str] = None
    assigned_to_id: Optional[int] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    total_hours: Optional[float] = None
    work_status: str = "YET_TO_START"
    qc_status: str = "YET_TO_START"
    audit_status: str = "YET_TO_START"
    current_remarks: Optional[str] = None

class C2LBatchCreate(C2LBatchBase):
    pass

class C2LBatchUpdate(BaseModel):
    batch_type: Optional[str] = None
    location: Optional[str] = None
    complexity: Optional[str] = None
    assigned_to_id: Optional[int] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    total_hours: Optional[float] = None
    work_status: Optional[str] = None
    qc_status: Optional[str] = None
    audit_status: Optional[str] = None
    current_remarks: Optional[str] = None

class C2LBatchOut(C2LBatchBase):
    id: int
    assigned_to: Optional[UserOut] = None
    is_client_ready: bool = False
    co_assignments: List[CoAssignmentOut] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class C2LBatchDetailOut(C2LBatchOut):
    work_logs: List[WorkLogOut] = []
    # audits and qc_issues can be loaded in detail view
