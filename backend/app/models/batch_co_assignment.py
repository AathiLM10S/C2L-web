from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base

class BatchCoAssignment(Base):
    __tablename__ = "batch_co_assignments"

    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer, ForeignKey("c2l_batches.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    role_note = Column(String(100), nullable=True)  # e.g., "Co-worker", "Continuation"
    assigned_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("batch_id", "user_id", name="uq_batch_user_coassign"),
    )

    # Relationships
    batch = relationship("C2LBatch", back_populates="co_assignments")
    user = relationship("User")
