import csv
import io
import json
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel, validator
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.lead import Lead, LeadState

router = APIRouter()


class LeadIn(BaseModel):
    name: Optional[str] = None
    phone: str
    email: Optional[str] = None
    company: Optional[str] = None
    notes: Optional[str] = None

    @validator("phone")
    def phone_must_have_country_code(cls, v):
        v = v.strip().replace(" ", "")
        if not v.startswith("+"):
            raise ValueError("Phone must include country code e.g. +6591234567")
        return v


class LeadOut(BaseModel):
    id: str
    name: Optional[str]
    phone: str
    email: Optional[str]
    company: Optional[str]
    state: str
    call_attempts: int
    created_at: str

    class Config:
        from_attributes = True


def _upsert_lead(db: Session, data: LeadIn, source: str) -> tuple[Lead, bool]:
    existing = db.query(Lead).filter(Lead.phone == data.phone).first()
    if existing:
        return existing, False

    lead = Lead(
        name=data.name,
        phone=data.phone,
        email=data.email,
        company=data.company,
        notes=data.notes,
        source=source,
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead, True


@router.post("/ingest/json")
def ingest_json(leads_data: List[LeadIn], db: Session = Depends(get_db)):
    created, skipped = [], []

    for item in leads_data:
        lead, is_new = _upsert_lead(db, item, source="json")
        if is_new:
            created.append(str(lead.id))
        else:
            skipped.append(item.phone)

    return {
        "created": len(created),
        "skipped": len(skipped),
        "skipped_phones": skipped,
    }


@router.post("/ingest/csv")
async def ingest_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files accepted")

    content = await file.read()
    reader = csv.DictReader(io.StringIO(content.decode("utf-8")))

    created, skipped, errors = [], [], []

    for i, row in enumerate(reader):
        try:
            item = LeadIn(
                name=row.get("name"),
                phone=row.get("phone", ""),
                email=row.get("email"),
                company=row.get("company"),
                notes=row.get("notes"),
            )
            lead, is_new = _upsert_lead(db, item, source="csv")
            if is_new:
                created.append(str(lead.id))
            else:
                skipped.append(item.phone)
        except Exception as e:
            errors.append({"row": i + 2, "error": str(e)})

    return {
        "created": len(created),
        "skipped": len(skipped),
        "errors": errors,
    }


@router.get("")
def list_leads(
    state: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    query = db.query(Lead)
    if state:
        query = query.filter(Lead.state == state)
    leads = query.order_by(Lead.created_at.desc()).offset(skip).limit(limit).all()
    return [_serialize_lead(l) for l in leads]


def _serialize_lead(l: Lead) -> dict:
    return {
        "id": str(l.id),
        "name": l.name,
        "phone": l.phone,
        "email": l.email,
        "company": l.company,
        "state": l.state,
        "state_reason": l.state_reason,
        "call_attempts": l.call_attempts,
        "last_called_at": str(l.last_called_at) if l.last_called_at else None,
        "call_transcript": l.call_transcript,
        "call_summary": l.call_summary,
        "vapi_call_id": l.vapi_call_id,
        "whatsapp_opted_in": l.whatsapp_opted_in,
        "whatsapp_last_message_at": str(l.whatsapp_last_message_at) if l.whatsapp_last_message_at else None,
        "whatsapp_sequence_step": l.whatsapp_sequence_step,
        "meeting_scheduled_at": str(l.meeting_scheduled_at) if l.meeting_scheduled_at else None,
        "calcom_booking_id": l.calcom_booking_id,
        "preferred_time": l.preferred_time,
        "source": l.source,
        "notes": l.notes,
        "created_at": str(l.created_at),
        "updated_at": str(l.updated_at),
    }


@router.get("/{lead_id}")
def get_lead(lead_id: str, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return _serialize_lead(lead)


class LeadUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    company: Optional[str] = None
    phone: Optional[str] = None
    notes: Optional[str] = None
    state: Optional[str] = None


@router.patch("/{lead_id}")
def update_lead(lead_id: str, data: LeadUpdate, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(lead, field, value)
    db.commit()
    db.refresh(lead)
    return _serialize_lead(lead)


@router.delete("/{lead_id}")
def delete_lead(lead_id: str, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    db.delete(lead)
    db.commit()
    return {"deleted": lead_id}
