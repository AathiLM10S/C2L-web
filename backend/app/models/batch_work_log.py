from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base

class C2LBatchWorkLog(Base):
    __tablename__ = "c2l_batch_work_logs"

    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer, ForeignKey("c2l_batches.id"), nullable=False, index=True)
    sl_no = Column(Integer, nullable=True)
    assigned_to_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    work_type = Column(String(50), nullable=True)  # New, Rework, Continue
    start_date = Column(String(50), nullable=True)
    end_date = Column(String(50), nullable=True)
    total_hours = Column(Float, nullable=True)
    status = Column(String(50), nullable=False, default="YET_TO_START")
    qc_status = Column(String(50), nullable=False, default="YET_TO_START")
    qc_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    batch = relationship("C2LBatch", back_populates="work_logs")
    employee = relationship("User", back_populates="work_logs", foreign_keys=[assigned_to_id])
    qc_reviewer = relationship("User", foreign_keys=[qc_by_id])
