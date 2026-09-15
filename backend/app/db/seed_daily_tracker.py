import csv
import os
from datetime import datetime
from typing import Optional, List, Dict
from sqlalchemy.orm import Session
from sqlalchemy import create_engine

from app.core.config import settings
from app.db.database import Base, engine as local_engine, SessionLocal
from app.models.user import User
from app.models.daily_tracker import DailyTracker

DEFAULT_CSV_PATHS = [
    r"C:\C2l web\data\C2L_Daily_Update_Tracker.csv",
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "C2L_Daily_Update_Tracker.csv")),
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "C2L_Daily_Update_Tracker.csv")),
    r"c:\Users\saathithy\Downloads\C2L_Daily Update Tracker(Sheet1).csv",
]

NAME_ALIASES = {
    "bash": "Jothi Bash",
    "jothi bash": "Jothi Bash",
    "aathithya": "Aathithya",
    "aafrin": "Aafrin",
    "godwin": "Godwin",
    "naresh": "Naresh",
    "shyam": "Shyam",
    "vishnu": "Vishnu",
    "keerthana": "Keerthana",
    "suchitra": "Suchitra",
    "suchithra": "Suchithra",
}

def resolve_csv_path(custom_path: Optional[str] = None) -> str:
    if custom_path and os.path.exists(custom_path):
        return custom_path
    for p in DEFAULT_CSV_PATHS:
        if os.path.exists(p):
            return p
    raise FileNotFoundError("Could not locate C2L_Daily_Update_Tracker.csv in standard locations.")

def parse_tracker_date(raw: str) -> Optional[str]:
    if not raw:
        return None
    s = str(raw).strip()
    if not s or s.lower() in ["weekend", "none", "holiday"]:
        return None
    if "/" in s:
        parts = s.split("/")
        if len(parts) == 3:
            p0, p1, p2 = [p.strip() for p in parts]
            if p0 == "09":
                m, d = "09", p1
            elif p1 == "09":
                m, d = "09", p0
            elif p1 == "08":
                m, d = "08", p0
            elif p0 == "08":
                m, d = "08", p1
            else:
                m, d = p1, p0
            return f"{p2}-{m.zfill(2)}-{d.zfill(2)}"
    return s[:10]

def seed_daily_tracker_from_csv(db: Session, csv_path: Optional[str] = None) -> int:
    path = resolve_csv_path(csv_path)
    print(f"Reading tracker CSV from: {path}")

    # Build user lookup map from target database
    users = db.query(User).all()
    user_map: Dict[str, User] = {}
    for u in users:
        user_map[u.name.lower().strip()] = u
        first = u.name.lower().strip().split()[0]
        user_map[first] = u
        if u.email:
            user_map[u.email.lower().strip()] = u

    # Read CSV
    with open(path, "r", encoding="utf-8-sig") as f:
        reader = list(csv.reader(f))

    if len(reader) < 2:
        print("CSV does not contain sufficient rows.")
        return 0

    header_row = reader[0]
    engineers: List[Dict] = []
    for col_idx in range(1, len(header_row), 3):
        eng_name = header_row[col_idx].strip()
        if eng_name:
            engineers.append({"name": eng_name, "col": col_idx})

    # Clear existing tracker entries
    deleted_count = db.query(DailyTracker).delete()
    db.commit()
    print(f"Cleared {deleted_count} previous entries from c2l_daily_tracker.")

    inserted_count = 0
    # Data rows start at index 2 (row 3 of sheet)
    for r_idx, row in enumerate(reader[2:], start=2):
        if not row:
            continue
        raw_date = row[0].strip() if len(row) > 0 else ""
        task_date = parse_tracker_date(raw_date)
        if not task_date:
            continue

        for eng in engineers:
            c = eng["col"]
            p1 = row[c].strip() if len(row) > c else ""
            p2 = row[c + 1].strip() if len(row) > c + 1 else ""
            st = row[c + 2].strip() if len(row) > c + 2 else ""

            # Skip completely empty cell trios
            if not p1 and not p2 and not st:
                continue

            # Determine status
            status_val = st
            if not status_val:
                low_p1 = p1.lower()
                low_p2 = p2.lower()
                if "leave" in low_p1 or "leave" in low_p2:
                    status_val = "Leave"
                elif "holiday" in low_p1 or "holiday" in low_p2:
                    status_val = "Leave"
                elif p1 or p2:
                    status_val = "Completed"
                else:
                    status_val = "In-Progress"

            # Match user in target database
            eng_raw = eng["name"].lower().strip()
            matched_user = user_map.get(eng_raw)
            if not matched_user:
                first = eng_raw.split()[0]
                matched_user = user_map.get(first)
            if not matched_user and "suchitra" in eng_raw:
                matched_user = user_map.get("suchithra")
            if not matched_user:
                for k, u in user_map.items():
                    if k in eng_raw or eng_raw in k:
                        matched_user = u
                        break

            user_id = matched_user.id if matched_user else None
            official_name = matched_user.name if matched_user else eng["name"]

            record = DailyTracker(
                user_id=user_id,
                user_name=official_name,
                task_date=task_date,
                phase_1=p1 or None,
                phase_2=p2 or None,
                status=status_val,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            db.add(record)
            inserted_count += 1

    db.commit()
    print(f"Successfully seeded {inserted_count} daily tracker records into c2l_daily_tracker!")
    return inserted_count

def seed_database(db_url: str, label: str = "Database") -> int:
    print(f"\n==================================================")
    print(f"Syncing Daily Tracker to: {label}")
    print(f"Connection: {db_url.split('@')[-1] if '@' in db_url else db_url}")
    print(f"==================================================")
    
    target_engine = create_engine(db_url)
    Base.metadata.create_all(bind=target_engine)
    
    from sqlalchemy.orm import sessionmaker
    TargetSession = sessionmaker(autocommit=False, autoflush=False, bind=target_engine)
    session = TargetSession()
    try:
        count = seed_daily_tracker_from_csv(session)
        return count
    finally:
        session.close()

if __name__ == "__main__":
    PROD_DB_URL = "postgresql://c2l_user:u5agZQz6ef8bkZYEYWV0XpCP6MS2nkCh@dpg-dah99qu1egvs73d4rcm0-a.oregon-postgres.render.com/c2l_qc?sslmode=require"
    
    # 1. Seed Local DB
    local_url = settings.DATABASE_URL
    seed_database(local_url, label="Local Database")
    
    # 2. Seed Production DB on Render
    seed_database(PROD_DB_URL, label="Production Database (Render c2l_qc)")
