import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

import requests

from app.core.config import settings

logger = logging.getLogger(__name__)

CALCOM_API_BASE = "https://api.cal.com/v2"


class CalComService:
    def __init__(self):
        self.headers = {
            "Authorization": f"Bearer {settings.CALCOM_API_KEY}",
            "cal-api-version": "2024-08-13",
            "Content-Type": "application/json",
        }
        self.event_type_id = int(settings.CALCOM_EVENT_TYPE_ID) if settings.CALCOM_EVENT_TYPE_ID else None

    def get_available_slots(self, days_ahead: int = 5) -> list[dict]:
        """Return the next N days of available slots as a flat list."""
        if not self.event_type_id:
            logger.error("CALCOM_EVENT_TYPE_ID not configured")
            return []

        start = datetime.now(timezone.utc)
        end = start + timedelta(days=days_ahead)

        params = {
            "eventTypeId": self.event_type_id,
            "startTime": start.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "endTime": end.strftime("%Y-%m-%dT%H:%M:%SZ"),
        }

        try:
            resp = requests.get(
                f"{CALCOM_API_BASE}/slots/available",
                params=params,
                headers=self.headers,
                timeout=10,
            )
            resp.raise_for_status()
            slots_by_day = resp.json().get("data", {}).get("slots", {})

            # Flatten into [{date, time_iso, label}]
            flat = []
            for day_slots in slots_by_day.values():
                for slot in day_slots:
                    t = slot.get("time", "")
                    if t:
                        dt = datetime.fromisoformat(t.replace("Z", "+00:00"))
                        # Convert to SGT (UTC+8) for display
                        sgt = dt + timedelta(hours=8)
                        flat.append({
                            "time_iso": t,
                            "label": sgt.strftime("%A %d %b, %I:%M %p SGT"),
                        })
            return flat[:10]  # cap at 10 slots

        except Exception as e:
            logger.error(f"Cal.com get_available_slots error: {e}")
            return []

    def create_booking(
        self,
        start_iso: str,
        name: str,
        email: str,
        timezone: str = "Asia/Singapore",
        notes: str = "",
    ) -> Optional[dict]:
        """Create a booking. Returns booking dict on success, None on failure."""
        if not self.event_type_id:
            logger.error("CALCOM_EVENT_TYPE_ID not configured")
            return None

        payload: dict = {
            "eventTypeId": self.event_type_id,
            "start": start_iso,
            "attendee": {
                "name": name,
                "email": email,
                "timeZone": timezone,
            },
        }
        if notes:
            payload["metadata"] = {"notes": notes}

        try:
            resp = requests.post(
                f"{CALCOM_API_BASE}/bookings",
                json=payload,
                headers=self.headers,
                timeout=30,
            )
            resp.raise_for_status()
            return resp.json().get("data", resp.json())

        except requests.HTTPError as e:
            logger.error(f"Cal.com create_booking HTTP error: {e.response.status_code} — {e.response.text}")
            return None
        except Exception as e:
            logger.error(f"Cal.com create_booking error: {e}")
            return None
