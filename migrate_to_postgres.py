import psycopg2
import sys
import os

# Step 1: Connect to PostgreSQL and ensure c2l_qc exists
try:
    conn = psycopg2.connect(
        host="localhost",
        port=5433,
        user="postgres",
        password="12345",
        dbname="postgres"
    )
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute("SELECT 1 FROM pg_database WHERE datname='c2l_qc';")
    exists = cur.fetchone()
    if not exists:
        cur.execute("CREATE DATABASE c2l_qc;")
        print("Created database 'c2l_qc' in PostgreSQL!")
    else:
        print("Database 'c2l_qc' exists in PostgreSQL.")
    cur.close()
    conn.close()
except Exception as e:
    print("Error connecting to PostgreSQL:", e)
    sys.exit(1)

# Step 2: Initialize SQLAlchemy models on PostgreSQL c2l_qc
sys.path.insert(0, "C:/C2l web/backend")
os.environ["DATABASE_URL"] = "postgresql://postgres:12345@localhost:5433/c2l_qc"

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.database import Base
import app.models
from app.services.csv_import_service import import_all_csv_data

pg_engine = create_engine("postgresql://postgres:12345@localhost:5433/c2l_qc")

print("Recreating clean tables in PostgreSQL c2l_qc...")
Base.metadata.drop_all(bind=pg_engine)
Base.metadata.create_all(bind=pg_engine)
print("Tables recreated with exact QC Reference and QC Issue schemas!")

# Step 3: Populate PostgreSQL with exact data
PgSession = sessionmaker(autocommit=False, autoflush=False, bind=pg_engine)
db = PgSession()
print("Importing all CSV datasets into PostgreSQL...")
res = import_all_csv_data(db)
print("Import Completed:", res)

# Step 4: Verify counts in PostgreSQL
from app.models.user import User
from app.models.c2l_batch import C2LBatch
from app.models.batch_work_log import C2LBatchWorkLog
from app.models.c2l_audit import C2LAudit
from app.models.qc_issue import QCIssue
from app.models.c2l_scenario import C2LScenario

print("\n=== POSTGRESQL VERIFICATION (Database: c2l_qc) ===")
print("Users:", db.query(User).count())
print("Batches:", db.query(C2LBatch).count())
print("Work Logs (Option A):", db.query(C2LBatchWorkLog).count())
print("Audits / QC Reference records:", db.query(C2LAudit).count())
print("QC Issues count (should be 0):", db.query(QCIssue).count())
print("Scenarios:", db.query(C2LScenario).count())
db.close()
