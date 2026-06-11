# AI Sales Engine

AI-powered sales automation platform with outbound calling and WhatsApp follow-up sequences.

**Two core systems:**
- **AI Cold Calling** — Vapi places outbound calls via Twilio, qualifies leads, assigns states
- **AI WhatsApp Automation** — Twilio receives/sends messages, Groq generates replies

## Stack

| Layer | Tech |
|-------|------|
| Backend | Python FastAPI (port 8000) |
| Frontend | React + Vite + TypeScript + Tailwind (port 3000) |
| Database | PostgreSQL (port 5432) |
| Queue | Redis + Celery (port 6379) |
| Calling | Vapi + Twilio |
| WhatsApp | Twilio Sandbox → WhatsApp Business API |
| AI | Groq (llama-3.3-70b-versatile) |
| Booking | Cal.com |

## Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL running on port 5432
- Redis running on port 6379
- ngrok (for local webhook tunneling)

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
# Fill in all values in .env

# Run DB migrations
venv/bin/alembic upgrade head

# Start server
venv/bin/uvicorn app.main:app --port 8000 --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Workers (required for calls and WhatsApp)

```bash
# Celery worker (separate terminal)
cd backend
venv/bin/celery -A app.core.celery_app worker --loglevel=info -Q calls,whatsapp

# Celery beat for drip sequences (separate terminal)
venv/bin/celery -A app.core.celery_app beat --loglevel=info
```

### Webhook Tunnel

```bash
ngrok http 8000

# After ngrok starts, update Vapi with the new URL:
curl -X PATCH https://api.vapi.ai/assistant/<VAPI_ASSISTANT_ID> \
  -H "Authorization: Bearer <VAPI_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"serverUrl": "https://YOUR_NGROK_URL/webhooks/vapi"}'
```

> **Note:** ngrok free tier URL changes on every restart. For production, deploy to a VPS/Railway and use a fixed domain.

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in:

```
DATABASE_URL=postgresql://user:password@localhost:5432/ai_sales
REDIS_URL=redis://localhost:6379/0

VAPI_API_KEY=
VAPI_ASSISTANT_ID=
VAPI_PHONE_NUMBER_ID=

GROQ_API_KEY=

TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_NUMBER=whatsapp:+1XXXXXXXXXX

CALCOM_BOOKING_URL=https://cal.com/your-link
```

## Lead States

| State | Meaning |
|-------|---------|
| `pending` | Ingested, not yet called |
| `calling` | Call in progress |
| `hot` | Wants to book — gets Cal.com link immediately |
| `warm` | Interested — gets 4-step WhatsApp drip (Day 0/3/7/14) |
| `cold` | Not now — gets Day 7 follow-up |
| `lost` | Hard no — no further contact |
| `booked` | Meeting scheduled |
| `dnc` | Do not contact |

## API Endpoints

```
GET  /health
GET  /api/leads
POST /api/leads/ingest/json
POST /api/leads/ingest/csv
GET  /api/leads/{id}
POST /api/calls/{lead_id}/retry
GET  /api/calls/active
POST /api/calls/{call_sid}/stop
POST /api/calls/stop-all
POST /api/whatsapp/trigger
GET  /api/activities
POST /api/campaigns/launch
GET  /api/campaigns/status
POST /webhooks/vapi
POST /webhooks/twilio/whatsapp
```

## Call Flow

```
1. Ingest leads via CSV or JSON
2. Click "Launch Campaign" in the UI
3. Celery queues place_call for each pending lead
4. Vapi calls lead via your Twilio number
5. AI agent (Alex) qualifies the lead
6. Call ends → Vapi fires webhook → lead state updated
7. WhatsApp sequence triggered based on state
```

## Project Docs

Internal project state and roadmap live in `docs/` (gitignored).
