from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.database import get_db
from app.models.user import User
from app.models.c2l_scenario import C2LScenario
from app.schemas.c2l_scenario import C2LScenarioOut, C2LScenarioCreate, C2LScenarioUpdate
from app.core.permissions import get_current_user, require_roles
from app.services import scenario_service

router = APIRouter(prefix="/c2l/scenarios", tags=["C2L Scenarios"])

@router.get("", response_model=List[C2LScenarioOut])
def list_scenarios(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    scenarios = scenario_service.get_scenarios(db=db, skip=skip, limit=limit, search=search)
    return [C2LScenarioOut.model_validate(s) for s in scenarios]

@router.post("", response_model=C2LScenarioOut)
def add_scenario(
    scenario_in: C2LScenarioCreate,
    current_user: User = Depends(require_roles("ADMIN", "QC", "LEAD")),
    db: Session = Depends(get_db)
):
    sc = scenario_service.create_scenario(db, scenario_in, current_user.id)
    return C2LScenarioOut.model_validate(sc)

@router.put("/{scenario_id}", response_model=C2LScenarioOut)
def update_scenario_entry(
    scenario_id: int,
    scenario_in: C2LScenarioUpdate,
    current_user: User = Depends(require_roles("ADMIN", "QC", "LEAD")),
    db: Session = Depends(get_db)
):
    sc = scenario_service.update_scenario(db, scenario_id, scenario_in)
    if not sc:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return C2LScenarioOut.model_validate(sc)
