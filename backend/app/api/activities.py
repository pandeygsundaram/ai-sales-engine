from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.activity import Activity

router = APIRouter()


@router.get("/activities")
def get_activities(limit: int = 50, db: Session = Depends(get_db)):
    activities = (
        db.query(Activity)
        .order_by(Activity.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": str(a.id),
            "lead_id": a.lead_id,
            "lead_name": a.lead_name,
            "lead_phone": a.lead_phone,
            "type": a.type,
            "description": a.description,
            "timestamp": str(a.created_at),
        }
        for a in activities
    ]
