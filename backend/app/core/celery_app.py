from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "ai_sales_engine",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=[
        "app.tasks.call_tasks",
        "app.tasks.whatsapp_tasks",
    ],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Singapore",
    enable_utc=True,
    task_routes={
        "app.tasks.call_tasks.*": {"queue": "calls"},
        "app.tasks.whatsapp_tasks.*": {"queue": "whatsapp"},
    },
    # Beat schedule for drip campaigns
    beat_schedule={
        "process-warm-leads-daily": {
            "task": "app.tasks.whatsapp_tasks.process_warm_drip",
            "schedule": 86400.0,  # every 24 hours
        },
    },
)
