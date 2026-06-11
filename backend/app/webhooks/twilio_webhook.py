import logging
from groq import Groq
from fastapi import APIRouter, Request, Form, Depends
from fastapi.responses import Response, PlainTextResponse
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.lead import Lead, LeadState

logger = logging.getLogger(__name__)
router = APIRouter()

SYSTEM_PROMPT = """You are a friendly sales assistant for a marketing agency based in Singapore.
Your job is to answer questions, handle objections, and help the lead book a demo meeting.
Keep responses short (2-3 sentences max). Be warm and conversational.
If the lead wants to book a call, send them this link: {calcom_url}
If the lead says stop or unsubscribe, respond with STOP_CONTACT only."""


def twiml_reply(message: str) -> Response:
    # Escape special XML characters
    message = message.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    xml = f"""<?xml version="1.0" encoding="UTF-8"?><Response><Message><Body>{message}</Body></Message></Response>"""
    return Response(content=xml, media_type="text/xml")


@router.post("/twilio/whatsapp", response_class=Response)
async def twilio_whatsapp_webhook(
    request: Request,
    From: str = Form(...),
    Body: str = Form(...),
    db: Session = Depends(get_db),
):
    phone = From.replace("whatsapp:", "")
    message = Body.strip()

    lead = db.query(Lead).filter(Lead.phone == phone).first()

    # Handle opt-out
    if any(word in message.lower() for word in ["stop", "unsubscribe", "remove me"]):
        if lead:
            lead.state = LeadState.DNC
            db.commit()
        return twiml_reply("You've been removed from our list. Sorry to bother you!")

    # Mark as opted in
    if lead:
        lead.whatsapp_opted_in = True
        db.commit()

    context = f"Lead name: {lead.name or 'Unknown'}, Company: {lead.company or 'Unknown'}" if lead else ""

    groq_client = Groq(api_key=settings.GROQ_API_KEY)
    ai_response = groq_client.chat.completions.create(
        model=settings.GROQ_WHATSAPP_MODEL,
        messages=[
            {
                "role": "system",
                "content": SYSTEM_PROMPT.format(calcom_url=settings.CALCOM_BOOKING_URL) + f"\n\nContext: {context}",
            },
            {"role": "user", "content": message},
        ],
        max_tokens=150,
    )

    reply = ai_response.choices[0].message.content.strip()
    logger.info(f"Replying to {phone}: {reply}")
    return twiml_reply(reply)
