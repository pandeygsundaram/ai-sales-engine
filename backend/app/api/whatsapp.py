from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.lead import Lead
from app.tasks.whatsapp_tasks import trigger_whatsapp_sequence

router = APIRouter()


class ManualMessageRequest(BaseModel):
    lead_id: str
    sequence: str  # hot, warm, cold


@router.post("/trigger")
def trigger_sequence(body: ManualMessageRequest, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == body.lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    trigger_whatsapp_sequence.delay(body.lead_id, body.sequence)
    return {"message": f"WhatsApp {body.sequence} sequence triggered for lead {body.lead_id}"}
