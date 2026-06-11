import logging
from datetime import datetime

from app.core.celery_app import celery_app
from app.core.config import settings
from app.core.database import SessionLocal
from app.models.lead import Lead, LeadState
from app.services.whatsapp_service import WhatsAppService

logger = logging.getLogger(__name__)

# Drip sequences — (delay_days, message_template)
WARM_SEQUENCE = [
    (0, "Hi {name}! Thanks for your time on the call. We'd love to show you exactly how we help companies like {company} grow faster. Here's a quick overview: {calcom_url}"),
    (3, "Hey {name}, just checking in! Have you had a chance to look at what we shared? Happy to answer any questions."),
    (7, "Hi {name} — here's a quick case study from a client in your space: [link]. Would love to get 20 mins with you this week."),
    (14, "Hey {name}, last reach out from our side! If the timing isn't right, totally understand. Whenever you're ready, we're here: {calcom_url}"),
]

HOT_SEQUENCE = [
    (0, "Hi {name}! Great chatting with you. Book your demo here: {calcom_url} — takes 20 mins and we'll tailor it to {company}."),
]

COLD_SEQUENCE = [
    (7, "Hi {name}, we spoke briefly recently. No pressure at all — just wanted to leave this here in case the timing is better later: {calcom_url}"),
]


def _build_message(template: str, lead: Lead) -> str:
    return template.format(
        name=lead.name or "there",
        company=lead.company or "your company",
        calcom_url=settings.CALCOM_BOOKING_URL,
    )


@celery_app.task
def trigger_whatsapp_sequence(lead_id: str, sequence: str):
    db = SessionLocal()
    try:
        lead = db.query(Lead).filter(Lead.id == lead_id).first()
        if not lead:
            return

        if sequence == "hot":
            steps = HOT_SEQUENCE
        elif sequence == "warm":
            steps = WARM_SEQUENCE
        elif sequence == "cold":
            steps = COLD_SEQUENCE
        else:
            return

        # Schedule each step
        for delay_days, template in steps:
            countdown = delay_days * 86400  # convert days to seconds
            send_whatsapp_step.apply_async(
                args=[lead_id, template],
                countdown=countdown,
            )

        logger.info(f"Scheduled {len(steps)} WhatsApp messages for lead {lead_id} ({sequence})")
    finally:
        db.close()


@celery_app.task
def send_whatsapp_step(lead_id: str, template: str):
    db = SessionLocal()
    try:
        lead = db.query(Lead).filter(Lead.id == lead_id).first()
        if not lead:
            return

        # Don't message DNC or already booked leads
        if lead.state in [LeadState.DNC, LeadState.LOST]:
            logger.info(f"Skipping WhatsApp for lead {lead_id} — state: {lead.state}")
            return

        message = _build_message(template, lead)
        wa = WhatsAppService()
        wa.send_message(to_phone=lead.phone, message=message)

        lead.whatsapp_last_message_at = datetime.utcnow()
        lead.whatsapp_sequence_step += 1
        db.commit()

        logger.info(f"WhatsApp sent to lead {lead_id}")
    except Exception as e:
        logger.error(f"WhatsApp send failed for lead {lead_id}: {e}")
    finally:
        db.close()


@celery_app.task
def process_warm_drip():
    """Daily task — nudge warm leads who haven't booked yet."""
    db = SessionLocal()
    try:
        warm_leads = db.query(Lead).filter(Lead.state == LeadState.WARM).all()
        for lead in warm_leads:
            logger.info(f"Processing warm drip for lead {lead.id}")
    finally:
        db.close()
