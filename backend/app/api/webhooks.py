from fastapi import APIRouter
from app.webhooks.vapi_webhook import router as vapi_router
from app.webhooks.twilio_webhook import router as twilio_router
from app.webhooks.calcom_webhook import router as calcom_router

router = APIRouter()
router.include_router(vapi_router)
router.include_router(twilio_router)
router.include_router(calcom_router)
