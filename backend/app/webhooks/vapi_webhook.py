import json
import logging
from datetime import datetime

from fastapi import APIRouter, Request, HTTPException
from sqlalchemy.orm import Session
from fastapi import Depends

from app.core.database import get_db
from app.models.lead import Lead, LeadState
from app.services.calcom_service import CalComService
from app.tasks.whatsapp_tasks import trigger_whatsapp_sequence

logger = logging.getLogger(__name__)
router = APIRouter()


STATE_MAP = {
    "hot": LeadState.HOT,
    "warm": LeadState.WARM,
    "cold": LeadState.COLD,
    "lost": LeadState.LOST,
}


# ─── Tool call handlers ────────────────────────────────────────────────────────

def _handle_get_available_slots(args: dict) -> str:
    """Called by Vapi agent when lead asks 'what times are available?'"""
    calcom = CalComService()
    slots = calcom.get_available_slots(days_ahead=5)
    if not slots:
        return "I'm having trouble fetching available times right now. I'll send you a booking link on WhatsApp so you can pick a time that works for you."

    lines = [s["label"] for s in slots[:5]]
    return "Here are the next available slots:\n" + "\n".join(f"- {l}" for l in lines) + "\nWhich one works for you?"


def _handle_book_meeting(args: dict, call_id: str, db: Session) -> str:
    """Called by Vapi agent when lead confirms a time slot."""
    lead = db.query(Lead).filter(Lead.vapi_call_id == call_id).first()
    name = args.get("name") or (lead.name if lead and lead.name else "Client")
    email = args.get("email") or (lead.email if lead and lead.email else "client@example.com")
    start_iso = args.get("start_iso", "")
    tz = args.get("timezone", "Asia/Singapore")

    if not start_iso:
        return "Awesome, I have noted that day down! I'll send the calendar invite and confirmation directly to your WhatsApp."

    calcom = CalComService()
    booking = calcom.create_booking(
        start_iso=start_iso,
        name=name,
        email=email,
        timezone=tz,
    )

    if not booking:
        return "I wasn't able to lock that slot in right now. I'll send you a booking link on WhatsApp — you can pick a time directly from there."

    booking_uid = booking.get("uid", "")

    # Update lead record
    lead = db.query(Lead).filter(Lead.vapi_call_id == call_id).first()
    if lead:
        lead.state = LeadState.BOOKED
        lead.calcom_booking_id = booking_uid
        lead.email = lead.email or email
        try:
            lead.meeting_scheduled_at = datetime.fromisoformat(start_iso.replace("Z", "+00:00"))
        except Exception:
            pass
        db.commit()
        logger.info(f"Lead {lead.id} booked mid-call — Cal.com booking {booking_uid}")

    return f"Done! I've confirmed your slot. You'll get a calendar invite at {email} shortly. Looking forward to speaking with you!"


# ─── Main webhook ──────────────────────────────────────────────────────────────

@router.post("/vapi")
async def vapi_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.json()
    message = payload.get("message", {})
    event_type = message.get("type")

    # ── Handle agent tool calls (mid-call) ──────────────────────────────────
    if event_type == "tool-calls":
        call_id = message.get("call", {}).get("id", "")
        results = []

        for tool_call in message.get("toolCallList", []):
            tool_call_id = tool_call.get("id")
            fn_name = tool_call.get("function", {}).get("name", "")
            raw_args = tool_call.get("function", {}).get("arguments", "{}")

            try:
                args = json.loads(raw_args) if isinstance(raw_args, str) else raw_args
            except json.JSONDecodeError:
                args = {}

            if fn_name == "get_available_slots":
                result_text = _handle_get_available_slots(args)
            elif fn_name == "book_meeting":
                result_text = _handle_book_meeting(args, call_id, db)
            else:
                result_text = f"Unknown tool: {fn_name}"

            results.append({"toolCallId": tool_call_id, "result": result_text})

        return {"results": results}

    # ── Handle end-of-call report ────────────────────────────────────────────
    if event_type != "end-of-call-report":
        return {"received": True}

    call_id = message.get("call", {}).get("id")
    transcript = message.get("transcript", "")
    structured = message.get("analysis", {}).get("structuredData", {})

    if not call_id:
        raise HTTPException(status_code=400, detail="Missing call ID")

    lead = db.query(Lead).filter(Lead.vapi_call_id == call_id).first()
    if not lead:
        phone = message.get("call", {}).get("customer", {}).get("number")
        if phone:
            lead = db.query(Lead).filter(Lead.phone == phone).order_by(Lead.created_at.desc()).first()

    if not lead:
        logger.warning(f"No lead found for Vapi call ID: {call_id}")
        return {"received": True}

    # If the lead was already booked mid-call, don't overwrite state
    if lead.state == LeadState.BOOKED:
        logger.info(f"Lead {lead.id} already booked mid-call — skipping state update")
        trigger_whatsapp_sequence.delay(str(lead.id), sequence="hot")
        return {"received": True, "lead_state": LeadState.BOOKED}

    raw_state = structured.get("lead_state", "cold").lower()
    new_state = STATE_MAP.get(raw_state, LeadState.COLD)

    lead.state = new_state
    lead.state_reason = structured.get("reason", "")
    lead.call_transcript = transcript
    lead.call_summary = structured.get("notes", "")
    lead.preferred_time = structured.get("preferred_time", "")

    if structured.get("email") and not lead.email:
        lead.email = structured["email"]

    db.commit()
    logger.info(f"Lead {lead.id} updated to state: {new_state}")

    if new_state == LeadState.HOT:
        trigger_whatsapp_sequence.delay(str(lead.id), sequence="hot")
    elif new_state == LeadState.WARM:
        trigger_whatsapp_sequence.delay(str(lead.id), sequence="warm")
    elif new_state == LeadState.COLD:
        trigger_whatsapp_sequence.delay(str(lead.id), sequence="cold")

    return {"received": True, "lead_state": new_state}
