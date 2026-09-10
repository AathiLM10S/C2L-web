from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base

class QCIssue(Base):
    __tablename__ = "qc_issues"

    id = Column(Integer, primary_key=True, index=True)
    sl_no = Column(Integer, nullable=True)
    batch_id = Column(Integer, ForeignKey("c2l_batches.id"), nullable=True, index=True)
    batch_no = Column(String(50), nullable=True, index=True)
    batch_owner_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    audit_id = Column(Integer, ForeignKey("c2l_audits.id"), nullable=True, index=True)
    
    issue_type = Column(String(100), nullable=False)  # CAD, Assessment, PDF, etc.
    remark = Column(Text, nullable=False)
    proof_url = Column(Text, nullable=True)
    qc_checked_by_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    qc_date = Column(String(50), nullable=False)
    status = Column(String(50), nullable=False, default="OPEN")  # OPEN, IN_REVIEW, RESOLVED
    resolution_note = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    batch = relationship("C2LBatch", back_populates="qc_issues", foreign_keys=[batch_id])
    batch_owner = relationship("User", foreign_keys=[batch_owner_id])
    audit = relationship("C2LAudit", back_populates="qc_issues", foreign_keys=[audit_id])
    qc_checker = relationship("User", back_populates="qc_issues_reported", foreign_keys=[qc_checked_by_id])
