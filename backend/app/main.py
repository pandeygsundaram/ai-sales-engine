from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import leads, calls, webhooks, whatsapp, activities, campaigns

app = FastAPI(title="AI Sales Engine", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(leads.router, prefix="/api/leads", tags=["Leads"])
app.include_router(calls.router, prefix="/api/calls", tags=["Calls"])
app.include_router(webhooks.router, prefix="/webhooks", tags=["Webhooks"])
app.include_router(whatsapp.router, prefix="/api/whatsapp", tags=["WhatsApp"])
app.include_router(activities.router, prefix="/api", tags=["Activities"])
app.include_router(campaigns.router, prefix="/api/campaigns", tags=["Campaigns"])


@app.get("/health")
def health():
    return {"status": "ok"}
