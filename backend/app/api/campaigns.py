from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.lead import Lead, LeadState
from app.tasks.call_tasks import place_call

router = APIRouter()


@router.post("/launch")
def launch_campaign(db: Session = Depends(get_db)):
    pending_leads = db.query(Lead).filter(Lead.state == LeadState.PENDING).all()

    if not pending_leads:
        return {"message": "No pending leads to call", "queued": 0}

    queued = []
    for lead in pending_leads:
        place_call.delay(str(lead.id))
        queued.append(str(lead.id))

    return {
        "message": f"Campaign launched — {len(queued)} calls queued",
        "queued": len(queued),
        "lead_ids": queued,
    }


@router.get("/status")
def campaign_status(db: Session = Depends(get_db)):
    return {
        "pending": db.query(Lead).filter(Lead.state == LeadState.PENDING).count(),
        "calling": db.query(Lead).filter(Lead.state == LeadState.CALLING).count(),
        "hot": db.query(Lead).filter(Lead.state == LeadState.HOT).count(),
        "warm": db.query(Lead).filter(Lead.state == LeadState.WARM).count(),
        "cold": db.query(Lead).filter(Lead.state == LeadState.COLD).count(),
        "lost": db.query(Lead).filter(Lead.state == LeadState.LOST).count(),
        "booked": db.query(Lead).filter(Lead.state == LeadState.BOOKED).count(),
    }
