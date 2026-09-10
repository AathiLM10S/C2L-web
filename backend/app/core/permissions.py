from typing import Optional, List
from fastapi import Depends, HTTPException, Query, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.core.security import decode_access_token
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

# Authorized names & emails for QC Reference editing and QC Issues access
QC_AUTHORIZED_USERS = {
    "system administrator",
    "jothi bash",
    "bash",
    "aathithya",
    "keerthana",
}

QC_AUTHORIZED_EMAILS = {
    "dharunkumar.j@solidpro-es.com",
    "jothibash.n@solidpro-es.com",
    "aathithyakathiresan.s@solidpro-es.com",
    "keerthana.a@solidpro-es.com",
    "admin@c2l-qc.com",
    "jothi.bash@c2l-qc.com",
    "aathithya@c2l-qc.com",
    "keerthana@c2l-qc.com",
}

def get_current_user(
    token_header: Optional[str] = Depends(oauth2_scheme),
    token_query: Optional[str] = Query(None, alias="token"),
    db: Session = Depends(get_db)
) -> User:
    token = token_header or token_query
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception
    
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    
    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return user

def require_roles(*allowed_roles: str):
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role == "ADMIN":
            return current_user
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted for role {current_user.role}"
            )
        return current_user
    return role_checker

def require_qc_issues_access(current_user: User = Depends(get_current_user)) -> User:
    """Only System Admin, Bash, Aathithya, and Keerthana can access / view QC Issues."""
    name_norm = current_user.name.strip().lower()
    email_norm = current_user.email.strip().lower()
    if (
        current_user.role == "ADMIN"
        or name_norm in QC_AUTHORIZED_USERS
        or email_norm in QC_AUTHORIZED_EMAILS
    ):
        return current_user
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Access denied: Only System Admin, Bash, Aathithya, and Keerthana can access QC Issues."
    )

def require_qc_reference_edit(current_user: User = Depends(get_current_user)) -> User:
    """Only Bash, Aathithya, Keerthana, and System Admin can edit QC Reference."""
    name_norm = current_user.name.strip().lower()
    email_norm = current_user.email.strip().lower()
    if (
        current_user.role == "ADMIN"
        or name_norm in QC_AUTHORIZED_USERS
        or email_norm in QC_AUTHORIZED_EMAILS
    ):
        return current_user
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Access denied: Only Bash, Aathithya, and Keerthana can edit QC Reference."
    )

def require_admin_only(current_user: User = Depends(get_current_user)) -> User:
    """Audit Workspace is restricted ONLY to System Administrator."""
    if current_user.role == "ADMIN" or current_user.email.strip().lower() == "admin@c2l-qc.com":
        return current_user
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Access denied: Audit Workspace can only be viewed by System Administrator."
    )
