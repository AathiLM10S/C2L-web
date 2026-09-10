import csv
import os
import re
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.user import User
from app.models.c2l_batch import C2LBatch
from app.models.batch_work_log import C2LBatchWorkLog
from app.models.batch_co_assignment import BatchCoAssignment
from app.models.c2l_audit import C2LAudit
from app.models.qc_issue import QCIssue
from app.models.c2l_scenario import C2LScenario
from app.core.security import get_password_hash

# Name normalization map
NAME_MAP = {
    "bash": "Jothi Bash",
    "jothi bash": "Jothi Bash",
    "jothi": "Jothi Bash",
    "aathithya": "Aathithya",
    "aafrin": "Aafrin",
    "godwin": "Godwin",
    "naresh": "Naresh",
    "shyam": "Shyam",
    "vishnu": "Vishnu",
    "keerthana": "Keerthana",
    "kerthana arul": "Keerthana",
    "suchitra": "Suchithra",
    "suchithra": "Suchithra",
    "admin": "System Administrator",
    "system administrator": "System Administrator",
}

ROLE_MAP = {
    "System Administrator": "ADMIN",
    "Dharun Kumar": "ADMIN",
    "Aathithya": "LEAD",
    "Jothi Bash": "LEAD",
    "Keerthana": "LEAD",
    "Aafrin": "EMPLOYEE",
    "Godwin": "EMPLOYEE",
    "Naresh": "EMPLOYEE",
    "Shyam": "EMPLOYEE",
    "Vishnu": "EMPLOYEE",
    "Suchithra": "EMPLOYEE",
}

EMAIL_MAP = {
    "System Administrator": "dharunkumar.j@solidpro-es.com",
    "Dharun Kumar": "dharunkumar.j@solidpro-es.com",
    "Jothi Bash": "jothibash.n@solidpro-es.com",
    "Aathithya": "aathithyakathiresan.s@solidpro-es.com",
    "Keerthana": "keerthana.a@solidpro-es.com",
    "Aafrin": "zubaithaaafrin.h@solidpro-es.com",
    "Suchithra": "suchitra.j@solidpro-es.com",
    "Vishnu": "vishnu.r@solidpro-es.com",
    "Godwin": "godwinmanogin.d@solidpro-es.com",
    "Shyam": "shyamganesh.n@solidpro-es.com",
    "Naresh": "naresh.k@solidpro-es.com",
}

def normalize_name(raw_name: Optional[str]) -> Optional[str]:
    if not raw_name or not raw_name.strip():
        return None
    cleaned = raw_name.strip()
    return NAME_MAP.get(cleaned.lower(), cleaned)

def parse_date_flexible(val: Optional[str]) -> Optional[str]:
    if not val or not val.strip():
        return None
    v = val.strip()
    for fmt in ("%d-%b-%y", "%d-%b-%Y", "%d/%m/%Y", "%Y-%m-%d", "%m/%d/%Y"):
        try:
            dt = datetime.strptime(v, fmt)
            return dt.strftime("%Y-%m-%d")
        except ValueError:
            continue
    return v

def normalize_work_status(val: Optional[str]) -> str:
    if not val or not val.strip():
        return "YET_TO_START"
    v = val.strip().lower()
    if "complete" in v:
        return "COMPLETED"
    if "in progress" in v or "inprogress" in v:
        return "IN_PROGRESS"
    if "hold" in v:
        return "ON_HOLD"
    if "yet" in v or "start" in v:
        return "YET_TO_START"
    if "cancel" in v:
        return "CANCELLED"
    return "UNCLASSIFIED"

def get_or_create_user(db: Session, raw_name: str, cache: Dict[str, User]) -> Optional[User]:
    norm = normalize_name(raw_name)
    if not norm:
        return None
    if norm in cache:
        return cache[norm]
    
    email = EMAIL_MAP.get(norm, f"{norm.lower().replace(' ', '.')}@solidpro-es.com")
    user = db.query(User).filter(or_(User.name == norm, User.email == email)).first()
    if not user:
        role = ROLE_MAP.get(norm, "EMPLOYEE")
        pwd = "Welcome@123"
        user = User(
            name=norm,
            email=email,
            password_hash=get_password_hash(pwd),
            role=role,
            is_active=True
        )
        db.add(user)
        db.flush()
    else:
        # ensure email and role are synced
        user.email = email
        user.role = ROLE_MAP.get(norm, user.role)
        db.flush()
    
    cache[norm] = user
    return user

def seed_default_admin(db: Session, cache: Dict[str, User]):
    admin = db.query(User).filter(User.email == "dharunkumar.j@solidpro-es.com").first()
    if not admin:
        admin = User(
            name="Dharun Kumar",
            email="dharunkumar.j@solidpro-es.com",
            password_hash=get_password_hash("Welcome@123"),
            role="ADMIN",
            is_active=True
        )
        db.add(admin)
        db.flush()
    cache["System Administrator"] = admin
    cache["Admin"] = admin
    cache["Dharun Kumar"] = admin

def get_default_data_dir() -> str:
    env_dir = os.getenv("DATA_DIR")
    if env_dir and os.path.exists(env_dir):
        return env_dir
    cur_file = os.path.abspath(__file__)
    # candidate paths relative to this file
    candidates = [
        os.path.abspath(os.path.join(cur_file, "..", "..", "..", "..", "data")),
        os.path.abspath(os.path.join(cur_file, "..", "..", "..", "data")),
        os.path.abspath(os.path.join(cur_file, "..", "..", "data")),
        "data",
        "C:/C2l web/data",
        "/app/data",
    ]
    for c in candidates:
        if os.path.exists(c):
            return c
    return "data"

def import_all_csv_data(db: Session, data_dir: Optional[str] = None) -> Dict[str, Any]:
    if not data_dir or not os.path.exists(data_dir):
        data_dir = get_default_data_dir()
    stats = {
        "users_created": 0,
        "batches_imported": 0,
        "work_logs_imported": 0,
        "audits_imported": 0,
        "qc_issues_imported": 0,
        "scenarios_seeded": 0,
        "auto_promoted_to_qc": 0,
    }
    
    user_cache: Dict[str, User] = {}
    seed_default_admin(db, user_cache)

    # Pre-seed staff members so IDs are consistent
    for staff_name in ["Jothi Bash", "Aathithya", "Keerthana", "Aafrin", "Godwin", "Naresh", "Shyam", "Vishnu", "Suchithra"]:
        get_or_create_user(db, staff_name, user_cache)
    
    # 1. Cleanly clear previous tables so data matches exact CSVs
    db.query(C2LBatchWorkLog).delete()
    db.query(C2LAudit).delete()
    db.query(QCIssue).delete()
    db.query(BatchCoAssignment).delete()
    db.query(C2LBatch).delete()
    db.flush()

    # 1. Inspect and import C2L_Batch_Status.csv (all 153 populated rows)
    batch_status_path = os.path.join(data_dir, "C2L_Batch_Status.csv")
    batch_map: Dict[str, C2LBatch] = {}

    if os.path.exists(batch_status_path):
        with open(batch_status_path, encoding="cp1252", errors="replace") as f:
            reader = csv.DictReader(f)
            for row in reader:
                b_no = row.get("Batch No", "").strip()
                if not b_no:
                    continue
                
                owner_name = row.get("Batch Owner", "").strip()
                owner_user = get_or_create_user(db, owner_name, user_cache) if owner_name else None
                
                complexity = row.get("Complexity", "").strip() or None
                location = row.get("Location", "").strip() or None
                b_status = normalize_work_status(row.get("Batch Status", ""))
                q_status = "COMPLETED" if row.get("QC Status", "").strip().lower() == "completed" else ("ON_HOLD" if row.get("QC Status", "").strip().lower() == "hold" else "YET_TO_START")
                a_status = "PASSED" if row.get("Auditor Status", "").strip().lower() == "completed" else "PENDING"
                remarks = row.get("Remarks", "").strip() or None

                batch = C2LBatch(
                    batch_no=b_no,
                    complexity=complexity,
                    location=location,
                    assigned_to_id=owner_user.id if owner_user else None,
                    work_status=b_status,
                    qc_status=q_status,
                    audit_status=a_status,
                    current_remarks=remarks
                )
                db.add(batch)
                db.flush()
                batch_map[b_no] = batch
                stats["batches_imported"] += 1

    # 2. Inspect and import C2L_Log.csv
    log_path = os.path.join(data_dir, "C2L_Log.csv")
    completed_log_batch_nos = set()

    if os.path.exists(log_path):
        with open(log_path, encoding="cp1252", errors="replace") as f:
            reader = csv.DictReader(f)
            for row in reader:
                b_no = row.get("Batch No", "").strip()
                if not b_no:
                    continue
                
                emp_name = row.get("Assigned to", "").strip()
                emp_user = get_or_create_user(db, emp_name, user_cache) if emp_name else None
                
                qc_by_name = row.get("QC By", "").strip()
                qc_user = get_or_create_user(db, qc_by_name, user_cache) if qc_by_name else None
                
                batch_type = row.get("Batch Type", "").strip() or None
                location = row.get("Location", "").strip() or None
                work_type = row.get("Type of Work", "").strip() or "New"
                start_d = parse_date_flexible(row.get("Start Date", ""))
                end_d = parse_date_flexible(row.get("End Date", ""))
                
                hours = None
                try:
                    h_val = row.get("Total Hours", "").strip()
                    if h_val:
                        hours = float(h_val)
                except ValueError:
                    pass

                w_status = normalize_work_status(row.get("Status", ""))
                q_status = "COMPLETED" if "complete" in row.get("QC Status", "").lower() else "YET_TO_START"
                remarks = row.get("Remarks", "").strip() or None
                
                sl_no_val = None
                try:
                    sl_no_val = int(row.get("Sl.No", "").strip())
                except ValueError:
                    pass

                if w_status == "COMPLETED":
                    completed_log_batch_nos.add(b_no)

                if b_no not in batch_map:
                    batch = C2LBatch(
                        batch_no=b_no,
                        batch_type=batch_type,
                        location=location,
                        assigned_to_id=emp_user.id if emp_user else None,
                        start_date=start_d,
                        end_date=end_d,
                        total_hours=hours,
                        work_status=w_status,
                        qc_status=q_status,
                        audit_status="PASSED" if q_status == "COMPLETED" else "PENDING",
                        current_remarks=remarks
                    )
                    db.add(batch)
                    db.flush()
                    batch_map[b_no] = batch
                    stats["batches_imported"] += 1
                else:
                    existing = batch_map[b_no]
                    if batch_type and not existing.batch_type:
                        existing.batch_type = batch_type
                    if location and not existing.location:
                        existing.location = location
                    if start_d and not existing.start_date:
                        existing.start_date = start_d
                    if end_d and not existing.end_date:
                        existing.end_date = end_d
                    if hours and not existing.total_hours:
                        existing.total_hours = hours
                    if emp_user and not existing.assigned_to_id:
                        existing.assigned_to_id = emp_user.id

                target_batch = batch_map[b_no]
                work_log = C2LBatchWorkLog(
                    batch_id=target_batch.id,
                    sl_no=sl_no_val,
                    assigned_to_id=emp_user.id if emp_user else None,
                    work_type=work_type,
                    start_date=start_d,
                    end_date=end_d,
                    total_hours=hours,
                    status=w_status,
                    qc_status=q_status,
                    qc_by_id=qc_user.id if qc_user else None,
                    remarks=remarks
                )
                db.add(work_log)
                stats["work_logs_imported"] += 1

    # 3. Import QC_Reference.csv exactly as the QC Audits / QC Reference data
    # IMPORTANT: DO NOT split into qc_issues! Keep qc_issues blank as requested!
    db.query(QCIssue).delete()
    db.query(C2LAudit).delete()
    db.flush()

    qc_ref_path = os.path.join(data_dir, "QC_Reference.csv")
    existing_qc_ref_batches = set()

    if os.path.exists(qc_ref_path):
        with open(qc_ref_path, encoding="cp1252", errors="replace") as f:
            reader = csv.DictReader(f)
            for row in reader:
                b_no = row.get("BATCH.NO", "").strip()
                if not b_no:
                    continue
                
                existing_qc_ref_batches.add(b_no)

                s_no_val = None
                try:
                    s_no_val = int(row.get("S.NO ", "").strip())
                except ValueError:
                    pass

                owner_name = row.get("BATCH OWNER", "").strip()
                owner_user = get_or_create_user(db, owner_name, user_cache) if owner_name else None
                
                auditor_name = row.get("ASSIGNED T0", "").strip()
                auditor_user = get_or_create_user(db, auditor_name, user_cache) if auditor_name else None
                
                start_d = parse_date_flexible(row.get("Start Date", ""))
                end_d = parse_date_flexible(row.get("End Date", ""))
                audit_d = start_d or datetime.now().strftime("%Y-%m-%d")
                
                qc_stat_raw = row.get("QC Status", "").strip()
                audit_stat_raw = row.get(" Audit  STATUS", "").strip()
                remarks_val = row.get("REMARKS", "").strip() or None
                sheet_metal_val = row.get("Sheeet Metal QC", "").strip() or None

                audit_res = "PASS" if (audit_stat_raw.lower() in ("yes", "passed") or qc_stat_raw.lower() in ("yes", "passed")) else "PENDING"
                if qc_stat_raw.lower() == "hold":
                    audit_res = "FAIL"

                target_batch = batch_map.get(b_no)
                batch_id = target_batch.id if target_batch else None

                # Exact QC Reference record
                audit_entry = C2LAudit(
                    sl_no=s_no_val,
                    batch_id=batch_id,
                    batch_no=b_no,
                    batch_owner_id=owner_user.id if owner_user else None,
                    audited_by_id=auditor_user.id if auditor_user else None,
                    start_date=start_d,
                    end_date=end_d,
                    audit_date=audit_d,
                    qc_status=qc_stat_raw or "Pending",
                    audit_status=audit_stat_raw or "Pending",
                    audit_result=audit_res,
                    sheet_metal_qc=sheet_metal_val,
                    remarks=remarks_val
                )
                db.add(audit_entry)
                stats["audits_imported"] += 1

    # 4. Completed C2L batches not in QC Reference are queried dynamically for the Audit Workspace
    # so that the System Administrator can review and audit them individually.

    # 5. Scenarios
    if db.query(C2LScenario).count() == 0:
        aathithya = user_cache.get("Aathithya")
        updater_id = aathithya.id if aathithya else 1
        sample_scenarios = [
            {
                "scenario": "CAD Assessment PN Mismatch in Teamcenter",
                "remark": "PN .0624 should be used as per TC instead of .0625. Verify revision against Teamcenter before drafting.",
                "updated_date": "2026-09-09",
                "individual_or_team": "Team",
                "last_snip_url": "https://sharepoint.c2l.internal/scenarios/snip_cad_pn_mismatch.png"
            },
            {
                "scenario": "Illegal characters in P/N revision description",
                "remark": "P/N having special characters like '#' or '/' must be normalized per TC & SE naming conventions prior to audit submission.",
                "updated_date": "2026-09-08",
                "individual_or_team": "Team",
                "last_snip_url": "https://sharepoint.c2l.internal/scenarios/snip_illegal_char.png"
            },
            {
                "scenario": "Missing CAD files in Insight original folder",
                "remark": "Link check must be executed before moving batch to completed. If MOA assembly files are missing, escalate to Lead immediately.",
                "updated_date": "2026-09-07",
                "individual_or_team": "Individual",
                "last_snip_url": "https://sharepoint.c2l.internal/scenarios/snip_missing_cad.png"
            },
            {
                "scenario": "Material & Reference Formula missing on draft",
                "remark": "Ensure Hussmann logo and material formula are placed correctly on Reach-in sheets without overlapping blank bounding boxes.",
                "updated_date": "2026-09-05",
                "individual_or_team": "Team",
                "last_snip_url": "https://sharepoint.c2l.internal/scenarios/snip_material_formula.png"
            },
            {
                "scenario": "Sheet Metal QC requirement checklist",
                "remark": "Sheet Metal QC flag must be toggled for 10-Purchased Parts and 3-7/10 digit part assemblies containing formed sheet panels.",
                "updated_date": "2026-09-02",
                "individual_or_team": "Team",
                "last_snip_url": "https://sharepoint.c2l.internal/scenarios/snip_sheet_metal.png"
            }
        ]
        for sc in sample_scenarios:
            db.add(C2LScenario(
                scenario=sc["scenario"],
                remark=sc["remark"],
                updated_by_id=updater_id,
                updated_date=sc["updated_date"],
                individual_or_team=sc["individual_or_team"],
                last_snip_url=sc["last_snip_url"]
            ))
            stats["scenarios_seeded"] += 1

    db.commit()
    stats["users_created"] = len(user_cache)
    return stats
