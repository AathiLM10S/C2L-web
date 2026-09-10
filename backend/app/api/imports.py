import os
import shutil
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.db.database import get_db
from app.models.user import User
from app.core.permissions import require_roles
from app.services import csv_import_service

router = APIRouter(prefix="/import", tags=["Data Import"])

@router.post("/seed-initial", response_model=Dict[str, Any])
def trigger_seed_existing(
    current_user: User = Depends(require_roles("ADMIN")),
    db: Session = Depends(get_db)
):
    """
    Imports and normalizes all 3 local CSV files:
    1. C2L_Batch_Status.csv
    2. C2L_Log.csv
    3. QC_Reference.csv
    Seeds users, batches, work logs (Option A), audits, QC issues, and scenarios.
    """
    result = csv_import_service.import_all_csv_data(db)
    return {
        "status": "success",
        "message": "CSV datasets imported and normalized successfully",
        "details": result
    }

@router.post("/c2l", response_model=Dict[str, Any])
async def upload_csv_file(
    file: UploadFile = File(...),
    file_type: str = "auto",  # log, batch_status, qc_reference, or auto
    current_user: User = Depends(require_roles("ADMIN")),
    db: Session = Depends(get_db)
):
    """
    Accepts multipart CSV upload, validates headers, and transforms into database records.
    """
    if not file.filename.endswith((".csv", ".txt")):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")

    upload_dir = "C:/C2l web/data/uploads"
    os.makedirs(upload_dir, exist_ok=True)
    temp_path = os.path.join(upload_dir, file.filename)
    
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    result = csv_import_service.import_all_csv_data(db, data_dir="C:/C2l web/data")
    return {
        "status": "success",
        "filename": file.filename,
        "import_result": result
    }
