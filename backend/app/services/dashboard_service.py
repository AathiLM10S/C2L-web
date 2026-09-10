from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, desc
from app.models.c2l_batch import C2LBatch
from app.models.c2l_audit import C2LAudit
from app.models.qc_issue import QCIssue
from app.models.batch_co_assignment import BatchCoAssignment
from app.models.batch_work_log import C2LBatchWorkLog
from app.models.user import User
from app.schemas.dashboard import DashboardKPIs, UserDashboardOut
from app.schemas.c2l_batch import C2LBatchOut
from app.schemas.c2l_audit import C2LAuditOut
from app.schemas.qc_issue import QCIssueOut

def get_dashboard_data(db: Session, current_user: User) -> UserDashboardOut:
    # Only System Admin (Dharun Kumar) sees the entire organization's overview.
    # Aathithya, Bash, and all team members see ONLY their own batch status.
    is_admin_or_manager = current_user.role == "ADMIN" or current_user.email in (
        "dharunkumar.j@solidpro-es.com",
        "admin@c2l-qc.com",
    )
    
    # Base batch query according to role
    batch_query = db.query(C2LBatch)
    qc_query = db.query(QCIssue)

    if not is_admin_or_manager:
        # Regular employee: filter to their own assigned and co-assigned batches
        co_ids = db.query(BatchCoAssignment.batch_id).filter(BatchCoAssignment.user_id == current_user.id)
        batch_query = batch_query.filter(
            or_(
                C2LBatch.assigned_to_id == current_user.id,
                C2LBatch.id.in_(co_ids)
            )
        )
        emp_batch_ids = db.query(C2LBatch.id).filter(
            or_(
                C2LBatch.assigned_to_id == current_user.id,
                C2LBatch.id.in_(co_ids)
            )
        )
        qc_query = qc_query.filter(
            or_(
                QCIssue.qc_checked_by_id == current_user.id,
                QCIssue.batch_id.in_(emp_batch_ids)
            )
        )

    all_user_batches = batch_query.all()
    total_b = len(all_user_batches)
    completed_b = sum(1 for b in all_user_batches if b.work_status == "COMPLETED")
    in_prog_b = sum(1 for b in all_user_batches if b.work_status == "IN_PROGRESS")
    yet_to_start_b = sum(1 for b in all_user_batches if b.work_status == "YET_TO_START")
    on_hold_b = sum(1 for b in all_user_batches if b.work_status == "ON_HOLD")
    
    pending_audit_b = sum(1 for b in all_user_batches if b.audit_status == "PENDING" or (b.work_status == "COMPLETED" and b.audit_status == "YET_TO_START"))
    audit_passed_b = sum(1 for b in all_user_batches if b.audit_status == "PASSED")
    audit_failed_b = sum(1 for b in all_user_batches if b.audit_status in ("FAILED", "RE_AUDIT"))
    
    # Client ready: Work completed AND Audit passed
    client_ready_b = sum(1 for b in all_user_batches if b.work_status == "COMPLETED" and b.audit_status == "PASSED")

    all_issues = qc_query.all()
    open_qc = sum(1 for q in all_issues if q.status == "OPEN")
    resolved_qc = sum(1 for q in all_issues if q.status == "RESOLVED")

    kpis = DashboardKPIs(
        total_batches=total_b,
        completed=completed_b,
        in_progress=in_prog_b,
        yet_to_start=yet_to_start_b,
        on_hold=on_hold_b,
        pending_audit=pending_audit_b,
        audit_passed=audit_passed_b,
        audit_failed=audit_failed_b,
        open_qc_issues=open_qc,
        resolved_qc_issues=resolved_qc,
        client_ready=client_ready_b
    )

    # Recent batches (up to 10)
    recent_batches_db = batch_query.order_by(desc(C2LBatch.updated_at), desc(C2LBatch.id)).limit(8).all()
    recent_batches = []
    for b in recent_batches_db:
        batch_out = C2LBatchOut.model_validate(b)
        batch_out.is_client_ready = (b.work_status == "COMPLETED" and b.audit_status == "PASSED")
        recent_batches.append(batch_out)

    # Recent QC issues (up to 6)
    recent_qc_db = qc_query.order_by(desc(QCIssue.id)).limit(6).all()
    recent_qc = []
    for q in recent_qc_db:
        q_out = QCIssueOut.model_validate(q)
        q_out.batch_no = q.batch.batch_no if q.batch else None
        q_out.batch_owner_name = q.batch.assigned_to.name if (q.batch and q.batch.assigned_to) else None
        recent_qc.append(q_out)

    # Status distribution for charts
    status_dist = {
        "Completed": completed_b,
        "In Progress": in_prog_b,
        "Yet to Start": yet_to_start_b,
        "On Hold": on_hold_b,
    }

    # Work type distribution from work logs
    work_types = db.query(C2LBatchWorkLog.work_type, func.count(C2LBatchWorkLog.id)).group_by(C2LBatchWorkLog.work_type).all()
    work_dist = {wt or "Standard": cnt for wt, cnt in work_types}

    # High Priority: On-Hold Batches for the current user and their operations
    user_co_ids = db.query(BatchCoAssignment.batch_id).filter(BatchCoAssignment.user_id == current_user.id)
    my_on_hold_query = db.query(C2LBatch).filter(
        C2LBatch.work_status == "ON_HOLD",
        or_(
            C2LBatch.assigned_to_id == current_user.id,
            C2LBatch.id.in_(user_co_ids)
        )
    )
    my_on_hold_count = my_on_hold_query.count()

    if not is_admin_or_manager:
        # Regular employee: exclusively sees their own on-hold batches
        on_hold_db = my_on_hold_query.order_by(desc(C2LBatch.updated_at), desc(C2LBatch.id)).all()
    else:
        # Admin / Lead: sees all on-hold batches, prioritizing those assigned to self first
        on_hold_db = db.query(C2LBatch).filter(
            C2LBatch.work_status == "ON_HOLD"
        ).order_by(
            desc(C2LBatch.assigned_to_id == current_user.id),
            desc(C2LBatch.updated_at),
            desc(C2LBatch.id)
        ).all()

    on_hold_batches = []
    for b in on_hold_db:
        b_out = C2LBatchOut.model_validate(b)
        b_out.is_client_ready = False
        on_hold_batches.append(b_out)

    # High Priority: QC Reference Records on Hold for corresponding Batch Owners
    qc_hold_filter = (
        func.lower(C2LAudit.qc_status).contains("hold") |
        func.lower(C2LAudit.audit_status).contains("hold") |
        func.lower(C2LAudit.audit_result).contains("hold")
    )
    my_on_hold_qc_query = db.query(C2LAudit).filter(
        qc_hold_filter,
        C2LAudit.batch_owner_id == current_user.id
    )
    my_on_hold_qc_count = my_on_hold_qc_query.count()

    if not is_admin_or_manager:
        # Regular employee: exclusively sees QC Reference records where they are the batch owner
        on_hold_qc_db = my_on_hold_qc_query.order_by(desc(C2LAudit.updated_at), desc(C2LAudit.id)).all()
    else:
        # Admin / Lead: sees all on-hold QC Reference records, prioritizing ones where they are batch owner first
        on_hold_qc_db = db.query(C2LAudit).filter(
            qc_hold_filter
        ).order_by(
            desc(C2LAudit.batch_owner_id == current_user.id),
            desc(C2LAudit.updated_at),
            desc(C2LAudit.id)
        ).all()

    on_hold_qc_references = [C2LAuditOut.model_validate(a) for a in on_hold_qc_db]

    return UserDashboardOut(
        user_name=current_user.name,
        user_role=current_user.role,
        is_admin_or_manager=is_admin_or_manager,
        kpis=kpis,
        recent_batches=recent_batches,
        recent_qc_issues=recent_qc,
        on_hold_batches=on_hold_batches,
        my_on_hold_count=my_on_hold_count,
        on_hold_qc_references=on_hold_qc_references,
        my_on_hold_qc_count=my_on_hold_qc_count,
        status_distribution=status_dist,
        work_type_distribution=work_dist
    )
