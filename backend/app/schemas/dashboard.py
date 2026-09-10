
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.schemas.c2l_batch import C2LBatchOut
from app.schemas.qc_issue import QCIssueOut
from app.schemas.c2l_audit import C2LAuditOut

class DashboardKPIs(BaseModel):
    total_batches: int
    completed: int
    in_progress: int
    yet_to_start: int
    on_hold: int
    pending_audit: int
    audit_passed: int
    audit_failed: int
    open_qc_issues: int
    resolved_qc_issues: int
    client_ready: int

class UserDashboardOut(BaseModel):
    user_name: str
    user_role: str
    is_admin_or_manager: bool
    kpis: DashboardKPIs
    recent_batches: List[C2LBatchOut]
    recent_qc_issues: List[QCIssueOut]
    on_hold_batches: List[C2LBatchOut] = []
    my_on_hold_count: int = 0
    on_hold_qc_references: List[C2LAuditOut] = []
    my_on_hold_qc_count: int = 0
    status_distribution: Dict[str, int]
    work_type_distribution: Dict[str, int]

class ReportSummary(BaseModel):
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    total_batches: int
    completed: int
    in_progress: int
    yet_to_start: int
    client_ready: int
    qc_issues_count: int
