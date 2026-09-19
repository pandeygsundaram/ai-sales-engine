import logging
from datetime import datetime, time
import pytz

from app.core.celery_app import celery_app
from app.core.config import settings
from app.core.database import SessionLocal
from app.models.lead import Lead, LeadState
from app.services.vapi_service import VapiService

logger = logging.getLogger(__name__)

MAX_CALL_ATTEMPTS = 2
SG_TZ = pytz.timezone("Asia/Singapore")
CALL_HOURS_START = time(9, 0)   # 9am SGT
CALL_HOURS_END = time(20, 0)    # 8pm SGT


def _is_within_call_hours() -> bool:
    now = datetime.now(SG_TZ).time()
    return CALL_HOURS_START <= now <= CALL_HOURS_END


@celery_app.task(bind=True, max_retries=3)
def schedule_calls_for_batch(self, lead_ids: list[str]):
    """Entry point: takes a list of lead IDs and queues individual call tasks."""
    for lead_id in lead_ids:
        place_call.apply_async(args=[lead_id], countdown=2)
    logger.info(f"Queued {len(lead_ids)} calls")


@celery_app.task(bind=True, max_retries=2, default_retry_delay=3600)
def place_call(self, lead_id: str, force: bool = False):
    """Places a single Vapi call for a lead."""
    db = SessionLocal()
    try:
        lead = db.query(Lead).filter(Lead.id == lead_id).first()
        if not lead:
            logger.error(f"Lead {lead_id} not found")
            return

        # Guards
        if not force and lead.state in [LeadState.BOOKED, LeadState.LOST, LeadState.DNC]:
            logger.info(f"Skipping lead {lead_id} — state: {lead.state}")
            return

        if not force and lead.call_attempts >= MAX_CALL_ATTEMPTS:
            lead.state = LeadState.COLD
            db.commit()
            logger.info(f"Lead {lead_id} maxed call attempts → COLD")
            return

        if not force and not _is_within_call_hours():
            # Retry in 1 hour
            raise self.retry(countdown=3600)

        vapi = VapiService()
        call_id = vapi.place_call(
            phone_number=lead.phone,
            assistant_id=settings.VAPI_ASSISTANT_ID,
            lead_name=lead.name,
        )

        lead.call_attempts += 1
        lead.last_called_at = datetime.utcnow()
        lead.state = LeadState.CALLING
        lead.vapi_call_id = call_id
        db.commit()

        logger.info(f"Call placed for lead {lead_id} | Vapi call ID: {call_id}")

    except Exception as e:
        db.rollback()
        logger.error(f"Error placing call for lead {lead_id}: {e}")
        raise self.retry(exc=e, countdown=1800)
    finally:
        db.close()
