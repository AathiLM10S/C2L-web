from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_
from app.models.c2l_scenario import C2LScenario
from app.schemas.c2l_scenario import C2LScenarioCreate, C2LScenarioUpdate

def get_scenarios(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None
) -> List[C2LScenario]:
    query = db.query(C2LScenario)
    if search:
        search_pat = f"%{search}%"
        query = query.filter(
            or_(
                C2LScenario.scenario.ilike(search_pat),
                C2LScenario.remark.ilike(search_pat)
            )
        )
    return query.order_by(desc(C2LScenario.updated_date)).offset(skip).limit(limit).all()

def create_scenario(db: Session, scenario_in: C2LScenarioCreate, user_id: int) -> C2LScenario:
    sc = C2LScenario(
        scenario=scenario_in.scenario,
        remark=scenario_in.remark,
        updated_by_id=user_id,
        updated_date=scenario_in.updated_date,
        individual_or_team=scenario_in.individual_or_team,
        last_snip_url=scenario_in.last_snip_url
    )
    db.add(sc)
    db.commit()
    db.refresh(sc)
    return sc

def update_scenario(db: Session, scenario_id: int, scenario_in: C2LScenarioUpdate) -> Optional[C2LScenario]:
    sc = db.query(C2LScenario).filter(C2LScenario.id == scenario_id).first()
    if not sc:
        return None
    for k, v in scenario_in.model_dump(exclude_unset=True).items():
        setattr(sc, k, v)
    db.commit()
    db.refresh(sc)
    return sc
