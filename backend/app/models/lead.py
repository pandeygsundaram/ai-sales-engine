import uuid
from datetime import datetime
from enum import Enum

from sqlalchemy import Column, String, DateTime, Text, Boolean, Integer
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class LeadState(str, Enum):
    PENDING = "pending"       # just ingested, not called yet
    CALLING = "calling"       # call in progress
    HOT = "hot"               # wants to book now
    WARM = "warm"             # interested but not ready
    COLD = "cold"             # not interested right now
    LOST = "lost"             # hard no
    BOOKED = "booked"         # meeting scheduled
    DNC = "dnc"               # do not contact


class Lead(Base):
    __tablename__ = "leads"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Contact info
    name = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=False, unique=True)
    email = Column(String(255), nullable=True)
    company = Column(String(255), nullable=True)

    # State
    state = Column(String(50), default=LeadState.PENDING)
    state_reason = Column(Text, nullable=True)

    # Call tracking
    call_attempts = Column(Integer, default=0)
    last_called_at = Column(DateTime, nullable=True)
    call_transcript = Column(Text, nullable=True)
    call_summary = Column(Text, nullable=True)
    vapi_call_id = Column(String(255), nullable=True)

    # WhatsApp tracking
    whatsapp_opted_in = Column(Boolean, default=False)
    whatsapp_last_message_at = Column(DateTime, nullable=True)
    whatsapp_sequence_step = Column(Integer, default=0)

    # Booking
    meeting_scheduled_at = Column(DateTime, nullable=True)
    calcom_booking_id = Column(String(255), nullable=True)
    preferred_time = Column(String(255), nullable=True)

    # Metadata
    source = Column(String(100), nullable=True)  # csv, json, manual
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
