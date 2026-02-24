"""Microsoft Graph API Email Service for sending and receiving emails."""

import os
import time
import base64
import logging
from datetime import datetime, timezone

import httpx

logger = logging.getLogger(__name__)

TENANT_ID = os.environ.get("AZURE_AD_TENANT_ID", "")
CLIENT_ID = os.environ.get("AZURE_AD_CLIENT_ID", "")
CLIENT_SECRET = os.environ.get("GRAPH_CLIENT_SECRET", "")
MAIL_USER = os.environ.get("GRAPH_MAIL_USER", "wohngemeinschaften@domusvita.de")

TOKEN_URL = f"https://login.microsoftonline.com/{TENANT_ID}/oauth2/v2.0/token"
GRAPH_BASE = "https://graph.microsoft.com/v1.0"

_token_cache: dict = {"access_token": "", "expires_at": 0}


async def _get_token() -> str:
    """Get an access token using client credentials flow. Cached for ~1h."""
    if _token_cache["access_token"] and time.time() < _token_cache["expires_at"] - 60:
        return _token_cache["access_token"]

    if not all([TENANT_ID, CLIENT_ID, CLIENT_SECRET]):
        raise RuntimeError("Graph API credentials not configured (AZURE_AD_TENANT_ID, AZURE_AD_CLIENT_ID, GRAPH_CLIENT_SECRET)")

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            TOKEN_URL,
            data={
                "client_id": CLIENT_ID,
                "client_secret": CLIENT_SECRET,
                "scope": "https://graph.microsoft.com/.default",
                "grant_type": "client_credentials",
            },
        )
        resp.raise_for_status()
        data = resp.json()

    _token_cache["access_token"] = data["access_token"]
    _token_cache["expires_at"] = time.time() + data.get("expires_in", 3600)
    return _token_cache["access_token"]


async def send_email(
    to: str,
    subject: str,
    body: str,
    attachments: list[tuple[str, bytes]] | None = None,
) -> bool:
    """Send an email via Graph API.

    Args:
        to: Recipient email address.
        subject: Email subject.
        body: Plain-text email body.
        attachments: Optional list of (filename, file_bytes) tuples.

    Returns:
        True if sent successfully, False otherwise.
    """
    try:
        token = await _get_token()
    except Exception as e:
        logger.error(f"Graph API token error: {e}")
        return False

    graph_attachments = []
    if attachments:
        for filename, file_bytes in attachments:
            graph_attachments.append({
                "@odata.type": "#microsoft.graph.fileAttachment",
                "name": filename,
                "contentBytes": base64.b64encode(file_bytes).decode("utf-8"),
            })

    payload = {
        "message": {
            "subject": subject,
            "body": {
                "contentType": "Text",
                "content": body,
            },
            "toRecipients": [{"emailAddress": {"address": to}}],
            "attachments": graph_attachments,
        },
        "saveToSentItems": "true",
    }

    url = f"{GRAPH_BASE}/users/{MAIL_USER}/sendMail"

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                url,
                json=payload,
                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                timeout=30.0,
            )
            if resp.status_code == 202:
                logger.info(f"Email sent to {to}: {subject}")
                return True
            else:
                logger.error(f"Graph sendMail failed ({resp.status_code}): {resp.text}")
                return False
    except Exception as e:
        logger.error(f"Graph sendMail error: {e}")
        return False


async def get_unread_emails(since: datetime | None = None) -> list[dict]:
    """Fetch unread emails from the shared mailbox.

    Returns list of dicts with keys: id, subject, body, from_email, from_name, received_at, has_attachments.
    """
    try:
        token = await _get_token()
    except Exception as e:
        logger.error(f"Graph API token error: {e}")
        return []

    filter_parts = ["isRead eq false"]
    if since:
        iso = since.strftime("%Y-%m-%dT%H:%M:%SZ")
        filter_parts.append(f"receivedDateTime ge {iso}")

    params = {
        "$filter": " and ".join(filter_parts),
        "$select": "id,subject,body,from,receivedDateTime,hasAttachments",
        "$orderby": "receivedDateTime asc",
        "$top": "50",
    }

    url = f"{GRAPH_BASE}/users/{MAIL_USER}/messages"

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                url,
                params=params,
                headers={"Authorization": f"Bearer {token}"},
                timeout=30.0,
            )
            resp.raise_for_status()
            data = resp.json()
    except Exception as e:
        logger.error(f"Graph getMessages error: {e}")
        return []

    results = []
    for msg in data.get("value", []):
        from_info = msg.get("from", {}).get("emailAddress", {})
        results.append({
            "id": msg["id"],
            "subject": msg.get("subject", ""),
            "body": msg.get("body", {}).get("content", ""),
            "from_email": from_info.get("address", ""),
            "from_name": from_info.get("name", ""),
            "received_at": msg.get("receivedDateTime", ""),
            "has_attachments": msg.get("hasAttachments", False),
        })

    return results


async def mark_as_read(message_id: str) -> bool:
    """Mark a message as read in the shared mailbox."""
    try:
        token = await _get_token()
    except Exception as e:
        logger.error(f"Graph API token error: {e}")
        return False

    url = f"{GRAPH_BASE}/users/{MAIL_USER}/messages/{message_id}"

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.patch(
                url,
                json={"isRead": True},
                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                timeout=15.0,
            )
            return resp.status_code == 200
    except Exception as e:
        logger.error(f"Graph markAsRead error: {e}")
        return False
