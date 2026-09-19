from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from twilio.rest import Client

from app.core.config import settings
from app.core.database import get_db
from app.models.lead import Lead
from app.services.whatsapp_service import WhatsAppService
from app.tasks.whatsapp_tasks import trigger_whatsapp_sequence

router = APIRouter()


class ManualMessageRequest(BaseModel):
    lead_id: str
    sequence: str  # hot, warm, cold


class SendMessageRequest(BaseModel):
    phone: str
    message: str


@router.post("/trigger")
def trigger_sequence(body: ManualMessageRequest, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == body.lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    trigger_whatsapp_sequence.delay(body.lead_id, body.sequence)
    return {"message": f"WhatsApp {body.sequence} sequence triggered for lead {body.lead_id}"}


@router.get("/messages")
def get_messages(phone: str = Query(...)):
    """Fetch real WhatsApp conversation history from Twilio for a given phone number."""
    phone_clean = phone.strip().replace(" ", "")
    if not phone_clean.startswith("+") and not phone_clean.startswith("whatsapp:"):
        phone_clean = "+" + phone_clean
    wa_target = f"whatsapp:{phone_clean}" if not phone_clean.startswith("whatsapp:") else phone_clean

    try:
        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        outbound = client.messages.list(to=wa_target, limit=40)
        inbound = client.messages.list(from_=wa_target, limit=40)

        all_msgs = []
        for m in outbound + inbound:
            all_msgs.append({
                "sid": m.sid,
                "direction": "outbound" if "outbound" in m.direction else "inbound",
                "from": m.from_,
                "to": m.to,
                "body": m.body,
                "status": m.status,
                "date_sent": str(m.date_sent or m.date_created),
                "timestamp": m.date_created.isoformat() if m.date_created else None,
            })

        # Sort chronologically ascending
        all_msgs.sort(key=lambda x: x["timestamp"] or "")
        return all_msgs
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch Twilio messages: {str(e)}")


@router.post("/send")
def send_message(body: SendMessageRequest):
    """Send a live WhatsApp message directly from the dashboard."""
    phone_clean = body.phone.strip().replace(" ", "")
    if not phone_clean.startswith("+"):
        raise HTTPException(status_code=400, detail="Phone must start with country code (+)")

    try:
        svc = WhatsAppService()
        sid = svc.send_message(to_phone=phone_clean, message=body.message)
        return {"status": "sent", "sid": sid}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to send WhatsApp message: {str(e)}")
