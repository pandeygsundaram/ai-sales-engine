import datetime
import urllib.parse
from typing import Optional
import httpx
import jwt
from fastapi import APIRouter, HTTPException, Query, status
from fastapi.responses import RedirectResponse
from pydantic import BaseModel

from app.core.config import settings

router = APIRouter()


class TokenResponse(BaseModel):
    token: str
    user: dict


@router.get("/google")
def login_google():
    """Redirect user to Google OAuth2 consent screen."""
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google Client ID is not configured on the backend.",
        )

    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "select_account",
    }
    url = f"https://accounts.google.com/o/oauth2/v2/auth?{urllib.parse.urlencode(params)}"
    return RedirectResponse(url=url)


@router.get("/google/callback")
async def google_callback(
    code: Optional[str] = Query(None),
    error: Optional[str] = Query(None),
):
    """Handle the OAuth2 callback from Google."""
    if error or not code:
        target_error = error or "missing_code"
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/login?error={urllib.parse.quote(target_error)}"
        )

    token_url = "https://oauth2.googleapis.com/token"
    token_payload = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "code": code,
        "grant_type": "authorization_code",
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        token_resp = await client.post(token_url, data=token_payload)
        if token_resp.status_code != 200:
            return RedirectResponse(
                url=f"{settings.FRONTEND_URL}/login?error=token_exchange_failed"
            )

        token_data = token_resp.json()
        access_token = token_data.get("access_token")

        userinfo_resp = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )

        if userinfo_resp.status_code != 200:
            return RedirectResponse(
                url=f"{settings.FRONTEND_URL}/login?error=userinfo_fetch_failed"
            )

        user_info = userinfo_resp.json()

    # Create backend application JWT
    now = datetime.datetime.now(datetime.timezone.utc)
    payload = {
        "sub": user_info.get("email"),
        "email": user_info.get("email"),
        "name": user_info.get("name") or user_info.get("email"),
        "picture": user_info.get("picture", ""),
        "iat": int(now.timestamp()),
        "exp": int((now + datetime.timedelta(days=7)).timestamp()),
    }
    app_token = jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")

    # Redirect directly back to frontend with the issued JWT
    return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?token={app_token}")
