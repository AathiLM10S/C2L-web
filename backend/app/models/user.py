from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="EMPLOYEE")  # EMPLOYEE, QC, LEAD, MANAGER, BU_HEAD, ADMIN
    is_active = Column(Boolean, default=True)
    external_user_id = Column(String(255), nullable=True)  # Reserved for Microsoft Entra ID object ID
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    assigned_batches = relationship("C2LBatch", back_populates="assigned_to", foreign_keys="C2LBatch.assigned_to_id")
    work_logs = relationship("C2LBatchWorkLog", back_populates="employee", foreign_keys="C2LBatchWorkLog.assigned_to_id")
    audits_conducted = relationship("C2LAudit", back_populates="auditor", foreign_keys="C2LAudit.audited_by_id")
    qc_issues_reported = relationship("QCIssue", back_populates="qc_checker", foreign_keys="QCIssue.qc_checked_by_id")
    scenarios_updated = relationship("C2LScenario", back_populates="updated_by", foreign_keys="C2LScenario.updated_by_id")
    daily_trackers = relationship("DailyTracker", back_populates="user", foreign_keys="DailyTracker.user_id")
