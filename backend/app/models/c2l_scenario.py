from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base

class C2LScenario(Base):
    __tablename__ = "c2l_scenarios"

    id = Column(Integer, primary_key=True, index=True)
    scenario = Column(Text, nullable=False)
    remark = Column(Text, nullable=True)
    updated_by_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    updated_date = Column(String(50), nullable=False)
    individual_or_team = Column(String(50), nullable=True)  # Individual / Team
    last_snip_url = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    updated_by = relationship("User", back_populates="scenarios_updated", foreign_keys=[updated_by_id])
