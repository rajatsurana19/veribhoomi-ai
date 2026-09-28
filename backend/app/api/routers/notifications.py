from typing import List, Optional
import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.notification import Notification
from app.models.user import User
from app.models.batch import Batch
from app.models.document import Document
from app.dependencies import get_current_user
from app.services.webhook_service import webhook_service

router = APIRouter(prefix="/notifications", tags=["Notifications"])

class SendNotificationRequest(BaseModel):
    recipient_role: Optional[str] = "operator" # operator, officer, admin
    recipient_user_id: Optional[str] = None
    batch_id: Optional[str] = None
    document_id: Optional[str] = None
    title: str
    message: str
    type: Optional[str] = "redo_request" # redo_request, revert_reply, info, warning

class RevertNotificationRequest(BaseModel):
    reply_message: str

@router.get("", summary="Get Current User Notifications")
def get_user_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notifs = db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc()).limit(30).all()
    
    result = []
    for n in notifs:
        result.append({
            "id": n.id,
            "user_id": n.user_id,
            "batch_id": n.batch_id,
            "document_id": n.document_id,
            "sender_id": n.sender_id,
            "sender_role": n.sender_role,
            "parent_notification_id": n.parent_notification_id,
            "action_type": getattr(n, "action_type", "info"),
            "title": n.title,
            "message": n.message,
            "type": n.type,
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat() if n.created_at else None
        })
    return result

@router.post("/send", summary="Hierarchical Notification Dispatch (Admin -> Officer -> Operator)")
def send_notification(
    req: SendNotificationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Sends redo notice or administrative instruction down or across the hierarchy.
    Supports single recipient or broadcast to all operators/officers.
    """
    from app.services.supabase_service import supabase_service

    target_user_ids = []
    if req.recipient_user_id == "all" or (req.recipient_role and not req.recipient_user_id and not req.batch_id and not req.document_id):
        users = db.query(User).filter(User.role == (req.recipient_role or "operator"), User.is_active == True).all()
        target_user_ids = [u.id for u in users]
    elif req.recipient_user_id:
        target_user_ids = [req.recipient_user_id]
    else:
        # If batch_id provided, find creator
        if req.batch_id:
            batch = db.query(Batch).filter(Batch.id == req.batch_id).first()
            if batch and batch.created_by:
                target_user_ids.append(batch.created_by)
        # If document_id provided, find batch creator
        elif req.document_id:
            doc = db.query(Document).filter(Document.id == req.document_id).first()
            if doc:
                b = db.query(Batch).filter(Batch.id == doc.batch_id).first()
                if b and b.created_by:
                    target_user_ids.append(b.created_by)

        if not target_user_ids and req.recipient_role:
            target_user = db.query(User).filter(User.role == req.recipient_role).first()
            if target_user:
                target_user_ids.append(target_user.id)

    if not target_user_ids:
        target_user_ids = [current_user.id]

    created_ids = []
    for uid in target_user_ids:
        notif = Notification(
            user_id=uid,
            batch_id=req.batch_id,
            document_id=req.document_id,
            sender_id=current_user.id,
            sender_role=current_user.role,
            action_type=req.type or "redo_request",
            title=req.title,
            message=req.message,
            type="warning" if "redo" in (req.type or "").lower() or "urgent" in (req.type or "").lower() else "info",
            is_read=False,
            created_at=datetime.datetime.utcnow()
        )
        db.add(notif)
        db.flush()
        created_ids.append(notif.id)

        # Mirror to Supabase cloud
        try:
            supabase_service.mirror_upsert("notifications", {
                "id": notif.id,
                "user_id": notif.user_id,
                "document_id": notif.document_id,
                "title": notif.title,
                "message": notif.message,
                "type": notif.type,
                "is_read": False,
                "created_at": notif.created_at.isoformat()
            })
        except Exception:
            pass

    # If linked to a document and is a redo request, set document status to needs_review
    if req.document_id and "redo" in (req.type or "").lower():
        doc = db.query(Document).filter(Document.id == req.document_id).first()
        if doc:
            doc.status = "needs_review"
            doc.rejection_reason = req.message

    db.commit()

    # Emit n8n webhook event for real-time notification dispatch
    webhook_service.emit_event(
        event_type="NOTIFICATION_DISPATCHED",
        document_id=req.document_id,
        batch_id=req.batch_id,
        actor_email=current_user.email,
        actor_role=current_user.role,
        status=req.type or "directive",
        payload_data={
            "title": req.title,
            "message": req.message,
            "type": req.type,
            "recipient_role": req.recipient_role,
            "target_count": len(created_ids),
            "created_notification_ids": created_ids
        }
    )

    return {"status": "success", "count": len(created_ids), "notification_ids": created_ids}

@router.post("/{notification_id}/revert", summary="Operator Reverts & Replies to Redo Notification")
def revert_notification(
    notification_id: str,
    req: RevertNotificationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Operator replies to a redo notice, marking the task as completed and
    alerting the sender (Officer or Admin) with confirmation.
    """
    orig_notif = db.query(Notification).filter(Notification.id == notification_id).first()
    if not orig_notif:
        raise HTTPException(status_code=404, detail="Notification not found")

    orig_notif.is_read = True

    # Send response back to original sender
    recipient_id = orig_notif.sender_id
    if not recipient_id:
        # Send to officer
        officer = db.query(User).filter(User.role == "officer").first()
        recipient_id = officer.id if officer else current_user.id

    reply_notif = Notification(
        user_id=recipient_id,
        batch_id=orig_notif.batch_id,
        document_id=orig_notif.document_id,
        sender_id=current_user.id,
        sender_role=current_user.role,
        parent_notification_id=orig_notif.id,
        action_type="revert_reply",
        title=f"Task Redone & Re-submitted by {current_user.full_name}",
        message=req.reply_message,
        type="success",
        is_read=False,
        created_at=datetime.datetime.utcnow()
    )
    db.add(reply_notif)

    # Update document status to reviewed / ready for approval
    if orig_notif.document_id:
        doc = db.query(Document).filter(Document.id == orig_notif.document_id).first()
        if doc:
            doc.status = "reviewed"
            doc.updated_at = datetime.datetime.utcnow()

    db.commit()

    # Emit n8n webhook event on operator resolution / reply
    webhook_service.emit_event(
        event_type="OPERATOR_REVERTED",
        document_id=orig_notif.document_id,
        batch_id=orig_notif.batch_id,
        actor_email=current_user.email,
        actor_role=current_user.role,
        status="reviewed",
        payload_data={
            "original_title": orig_notif.title,
            "reply_message": req.reply_message,
            "parent_notification_id": orig_notif.id,
            "recipient_id": recipient_id
        }
    )

    return {"status": "success", "reply_notification_id": reply_notif.id}

@router.patch("/{notification_id}/read", summary="Mark Notification as Read")
def mark_notification_read(
    notification_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    if notif:
        notif.is_read = True
        db.commit()
    return {"status": "success"}
