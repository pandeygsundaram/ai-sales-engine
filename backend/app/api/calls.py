import requests
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from typing import Optional
from pydantic import BaseModel
from app.core.config import settings
from app.core.database import get_db
from app.models.lead import Lead, LeadState
from app.tasks.call_tasks import place_call

router = APIRouter()

TWILIO_BASE = f"https://api.twilio.com/2010-04-01/Accounts/{settings.TWILIO_ACCOUNT_SID}"
TWILIO_AUTH = (settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)


class InstantCallRequest(BaseModel):
    phone: str
    name: Optional[str] = None
    email: Optional[str] = None
    company: Optional[str] = None
    notes: Optional[str] = None


@router.post("/instant")
def instant_call(data: InstantCallRequest, db: Session = Depends(get_db)):
    phone = data.phone.strip().replace(" ", "")
    if not phone.startswith("+"):
        raise HTTPException(status_code=400, detail="Phone must start with country code e.g. +91XXXXXXXXXX or +1XXXXXXXXXX")

    lead = db.query(Lead).filter(Lead.phone == phone).first()
    if not lead:
        lead = Lead(
            name=data.name or "Demo Lead",
            phone=phone,
            email=data.email,
            company=data.company or "Demo Company",
            notes=data.notes,
            source="instant_demo",
            state=LeadState.PENDING,
        )
        db.add(lead)
    else:
        if data.name:
            lead.name = data.name
        if data.email:
            lead.email = data.email
        if data.company:
            lead.company = data.company
        lead.state = LeadState.PENDING
        lead.vapi_call_id = None

    db.commit()
    db.refresh(lead)

    place_call.delay(str(lead.id), force=True)
    return {"message": f"Calling {phone} now", "lead_id": str(lead.id)}


@router.post("/{lead_id}/retry")
def retry_call(lead_id: str, db: Session = Depends(get_db)):
    from app.models.lead import LeadState
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    # Reset so place_call task doesn't skip it
    lead.state = LeadState.PENDING
    lead.call_attempts = max(0, lead.call_attempts - 1)
    lead.vapi_call_id = None
    db.commit()

    place_call.delay(lead_id)
    return {"message": f"Call queued for lead {lead_id}"}


@router.get("/active")
def get_active_calls(db: Session = Depends(get_db)):
    resp = requests.get(
        f"{TWILIO_BASE}/Calls.json",
        params={"Status": "in-progress", "PageSize": 50},
        auth=TWILIO_AUTH,
    )
    if not resp.ok:
        raise HTTPException(status_code=502, detail="Twilio error")

    twilio_calls = resp.json().get("calls", [])

    # Enrich with lead data from our DB
    result = []
    for call in twilio_calls:
        to_number = call.get("to", "").replace("whatsapp:", "")
        lead = db.query(Lead).filter(Lead.phone == to_number).first()
        result.append({
            "call_sid": call["sid"],
            "to": call["to"],
            "from": call["from"],
            "status": call["status"],
            "duration": call.get("duration", "0"),
            "start_time": call.get("start_time"),
            "lead_id": str(lead.id) if lead else None,
            "lead_name": lead.name if lead else None,
            "lead_company": lead.company if lead else None,
        })

    return result


@router.post("/{call_sid}/stop")
def stop_call(call_sid: str):
    resp = requests.post(
        f"{TWILIO_BASE}/Calls/{call_sid}.json",
        data={"Status": "completed"},
        auth=TWILIO_AUTH,
    )
    if not resp.ok:
        raise HTTPException(status_code=502, detail=f"Twilio error: {resp.text}")
    return {"message": f"Call {call_sid} terminated"}


@router.post("/stop-all")
def stop_all_calls():
    # Get all in-progress calls
    resp = requests.get(
        f"{TWILIO_BASE}/Calls.json",
        params={"Status": "in-progress", "PageSize": 50},
        auth=TWILIO_AUTH,
    )
    if not resp.ok:
        raise HTTPException(status_code=502, detail="Twilio error")

    calls = resp.json().get("calls", [])
    stopped = []

    for call in calls:
        r = requests.post(
            f"{TWILIO_BASE}/Calls/{call['sid']}.json",
            data={"Status": "completed"},
            auth=TWILIO_AUTH,
        )
        if r.ok:
            stopped.append(call["sid"])

    return {"stopped": len(stopped), "call_sids": stopped}
