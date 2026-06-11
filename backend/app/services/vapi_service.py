import requests
from app.core.config import settings


class VapiService:
    BASE_URL = "https://api.vapi.ai"

    def __init__(self):
        self.headers = {
            "Authorization": f"Bearer {settings.VAPI_API_KEY}",
            "Content-Type": "application/json",
        }

    def place_call(self, phone_number: str, assistant_id: str, lead_name: str = None) -> str:
        payload = {
            "assistantId": assistant_id,
            "phoneNumberId": settings.VAPI_PHONE_NUMBER_ID,
            "customer": {
                "number": phone_number,
            },
        }

        if lead_name:
            payload["assistantOverrides"] = {
                "variableValues": {
                    "lead_name": lead_name,
                }
            }

        response = requests.post(
            f"{self.BASE_URL}/call/phone",
            json=payload,
            headers=self.headers,
        )
        response.raise_for_status()
        return response.json()["id"]

    def get_call(self, call_id: str) -> dict:
        response = requests.get(
            f"{self.BASE_URL}/call/{call_id}",
            headers=self.headers,
        )
        response.raise_for_status()
        return response.json()
