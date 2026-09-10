from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.schemas.user import UserOut

class C2LScenarioBase(BaseModel):
    scenario: str
    remark: Optional[str] = None
    updated_date: str
    individual_or_team: Optional[str] = "Team"
    last_snip_url: Optional[str] = None

class C2LScenarioCreate(C2LScenarioBase):
    pass

class C2LScenarioUpdate(BaseModel):
    scenario: Optional[str] = None
    remark: Optional[str] = None
    updated_date: Optional[str] = None
    individual_or_team: Optional[str] = None
    last_snip_url: Optional[str] = None

class C2LScenarioOut(C2LScenarioBase):
    id: int
    updated_by_id: int
    updated_by: Optional[UserOut] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
