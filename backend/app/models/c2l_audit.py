from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base

class C2LAudit(Base):
    __tablename__ = "c2l_audits"

    id = Column(Integer, primary_key=True, index=True)
    sl_no = Column(Integer, nullable=True)
    batch_id = Column(Integer, ForeignKey("c2l_batches.id"), nullable=True, index=True)
    batch_no = Column(String(50), nullable=False, index=True)
    batch_owner_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    audited_by_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)  # ASSIGNED T0 (Auditor)
    
    start_date = Column(String(50), nullable=True)
    end_date = Column(String(50), nullable=True)
    audit_date = Column(String(50), nullable=True)
    
    qc_status = Column(String(50), nullable=True, default="YES")  # YES, Hold, etc.
    audit_status = Column(String(50), nullable=True, default="YES")
    audit_result = Column(String(50), nullable=True, default="PASS")
    
    sheet_metal_qc = Column(String(50), nullable=True)  # Yes / No from QC Reference
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    batch = relationship("C2LBatch", back_populates="audits", foreign_keys=[batch_id])
    batch_owner = relationship("User", foreign_keys=[batch_owner_id])
    auditor = relationship("User", back_populates="audits_conducted", foreign_keys=[audited_by_id])
    qc_issues = relationship("QCIssue", back_populates="audit")
