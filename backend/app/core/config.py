from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/ai_sales"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Vapi
    VAPI_API_KEY: str = ""
    VAPI_ASSISTANT_ID: str = ""
    VAPI_PHONE_NUMBER_ID: str = ""

    # Groq
    GROQ_API_KEY: str = ""
    GROQ_CALL_MODEL: str = "llama-3.3-70b-versatile"
    GROQ_WHATSAPP_MODEL: str = "llama-3.1-8b-instant"

    # Twilio
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_WHATSAPP_NUMBER: str = ""

    # Cal.com
    CALCOM_API_KEY: str = ""
    CALCOM_EVENT_TYPE_ID: str = ""
    CALCOM_BOOKING_URL: str = ""

    class Config:
        env_file = ".env"


settings = Settings()
