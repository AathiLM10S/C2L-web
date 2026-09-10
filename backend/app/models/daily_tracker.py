from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base

class DailyTracker(Base):
    __tablename__ = "c2l_daily_tracker"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    user_name = Column(String(150), nullable=False, index=True)
    task_date = Column(String(50), nullable=False, index=True)  # YYYY-MM-DD
    phase_1 = Column(Text, nullable=True)
    phase_2 = Column(Text, nullable=True)
    status = Column(String(50), nullable=False, default="In-Progress")  # Completed, In-Progress, On-Hold, Leave
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="daily_trackers", foreign_keys=[user_id])
