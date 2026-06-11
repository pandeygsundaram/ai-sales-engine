from twilio.rest import Client
from app.core.config import settings


class WhatsAppService:
    def __init__(self):
        self.client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        self.from_number = settings.TWILIO_WHATSAPP_NUMBER

    def send_message(self, to_phone: str, message: str) -> str:
        to = f"whatsapp:{to_phone}" if not to_phone.startswith("whatsapp:") else to_phone
        msg = self.client.messages.create(
            from_=self.from_number,
            to=to,
            body=message,
        )
        return msg.sid

    def send_template(self, to_phone: str, template_sid: str, variables: dict) -> str:
        to = f"whatsapp:{to_phone}" if not to_phone.startswith("whatsapp:") else to_phone
        msg = self.client.messages.create(
            from_=self.from_number,
            to=to,
            content_sid=template_sid,
            content_variables=str(variables),
        )
        return msg.sid
