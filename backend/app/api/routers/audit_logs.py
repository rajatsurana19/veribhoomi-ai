from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.audit_log import AuditLog
from app.schemas.audit import AuditLogOut
from app.dependencies import get_current_user, require_role

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])

@router.get("", response_model=List[AuditLogOut], summary="Fetch Immutable Audit Trail (Append-Only)")
def get_audit_logs(
    document_id: Optional[str] = None,
    user_id: Optional[str] = None,
    action: Optional[str] = None,
    area: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user = Depends(require_role(["admin", "officer", "operator"]))
):
    """
    Returns audit logs with search filters: date & time range, area, and action.
    """
    import datetime
    from app.models.batch import Batch
    from app.models.document import Document

    query = db.query(AuditLog)
    if document_id:
        query = query.filter(AuditLog.document_id == document_id)
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    if action:
        query = query.filter(AuditLog.action == action)
    if from_date:
        try:
            fd = datetime.datetime.fromisoformat(from_date.replace("Z", ""))
            query = query.filter(AuditLog.timestamp >= fd)
        except Exception:
            pass
    if to_date:
        try:
            td = datetime.datetime.fromisoformat(to_date.replace("Z", ""))
            query = query.filter(AuditLog.timestamp <= td)
        except Exception:
            pass
    if area:
        # Match village or district in related Batch
        query = query.outerjoin(Batch, AuditLog.batch_id == Batch.id).filter(
            (Batch.village.ilike(f"%{area}%")) | (Batch.district.ilike(f"%{area}%"))
        )

    logs = query.order_by(AuditLog.timestamp.desc()).offset(offset).limit(limit).all()
    return logs

