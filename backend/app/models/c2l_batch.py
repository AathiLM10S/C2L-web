from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base

class C2LBatch(Base):
    __tablename__ = "c2l_batches"

    id = Column(Integer, primary_key=True, index=True)
    batch_no = Column(String(50), index=True, nullable=False)
    batch_type = Column(String(50), nullable=True)  # 7-Digit, 10-Digit, etc.
    location = Column(String(150), nullable=True)   # Wide Island, Reach-in, Insight
    complexity = Column(String(150), nullable=True) # e.g. 10-Purchased Parts, 3-7/10 digit
    assigned_to_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    start_date = Column(String(50), nullable=True)  # ISO YYYY-MM-DD or raw
    end_date = Column(String(50), nullable=True)
    total_hours = Column(Float, nullable=True)
    
    # Statuses
    work_status = Column(String(50), nullable=False, default="YET_TO_START")  # YET_TO_START, IN_PROGRESS, COMPLETED, ON_HOLD, CANCELLED, UNCLASSIFIED
    qc_status = Column(String(50), nullable=False, default="YET_TO_START")    # YET_TO_START, IN_PROGRESS, COMPLETED, ON_HOLD
    audit_status = Column(String(50), nullable=False, default="YET_TO_START") # YET_TO_START, PENDING, IN_PROGRESS, PASSED, FAILED, RE_AUDIT
    
    current_remarks = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    assigned_to = relationship("User", back_populates="assigned_batches", foreign_keys=[assigned_to_id])
    work_logs = relationship("C2LBatchWorkLog", back_populates="batch", cascade="all, delete-orphan")
    audits = relationship("C2LAudit", back_populates="batch", cascade="all, delete-orphan")
    qc_issues = relationship("QCIssue", back_populates="batch", cascade="all, delete-orphan")
    co_assignments = relationship("BatchCoAssignment", back_populates="batch", cascade="all, delete-orphan")
