import logging
from datetime import datetime

from fastapi import APIRouter, Request, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.lead import Lead, LeadState

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/calcom")
async def calcom_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.json()

    trigger = payload.get("triggerEvent")
    logger.info(f"Cal.com webhook received: {trigger}")

    if trigger == "BOOKING_CREATED":
        _handle_booking_created(payload.get("payload", {}), db)
    elif trigger == "BOOKING_CANCELLED":
        _handle_booking_cancelled(payload.get("payload", {}), db)

    return {"received": True}


def _handle_booking_created(booking: dict, db: Session):
    uid = booking.get("uid", "")
    start_time = booking.get("startTime", "")
    attendees = booking.get("attendees", [])

    if not attendees:
        return

    attendee_email = attendees[0].get("email", "").lower().strip()
    lead = db.query(Lead).filter(Lead.email == attendee_email).first()

    if not lead:
        logger.warning(f"Cal.com BOOKING_CREATED — no lead found for email: {attendee_email}")
        return

    lead.state = LeadState.BOOKED
    lead.calcom_booking_id = uid

    if start_time:
        try:
            lead.meeting_scheduled_at = datetime.fromisoformat(start_time.replace("Z", "+00:00"))
        except Exception:
            pass

    db.commit()
    logger.info(f"Lead {lead.id} marked BOOKED via Cal.com webhook (booking: {uid})")


def _handle_booking_cancelled(booking: dict, db: Session):
    uid = booking.get("uid", "")
    if not uid:
        return

    lead = db.query(Lead).filter(Lead.calcom_booking_id == uid).first()
    if not lead:
        return

    # Revert to warm so they can be re-engaged
    lead.state = LeadState.WARM
    lead.calcom_booking_id = None
    lead.meeting_scheduled_at = None
    db.commit()
    logger.info(f"Lead {lead.id} booking cancelled — reverted to WARM")
