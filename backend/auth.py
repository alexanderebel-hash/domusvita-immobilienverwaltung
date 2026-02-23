"""
DomusVita Immobilienverwaltung - Authentication Module
Entra ID (Azure AD) token validation via JWKS
"""

from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Dict, Any, Optional
from datetime import datetime, timezone
import jwt
import aiohttp
import os
import logging

logger = logging.getLogger(__name__)

# Azure AD Configuration
AZURE_AD_TENANT_ID = os.environ.get('AZURE_AD_TENANT_ID')
AZURE_AD_CLIENT_ID = os.environ.get('AZURE_AD_CLIENT_ID')
DEV_MODE = os.environ.get('DEV_MODE', 'false').lower() == 'true'

security = HTTPBearer(auto_error=False)

# Mock user for dev mode
MOCK_USER = {
    "oid": "dev-mock-user-001",
    "email": "dev@domusvita.de",
    "name": "Dev User",
    "roles": ["User"],
}


class EntraIDValidator:
    def __init__(self, tenant_id: str, client_id: str):
        self.tenant_id = tenant_id
        self.client_id = client_id
        self.authority_url = f"https://login.microsoftonline.com/{tenant_id}/v2.0"
        self.jwks_uri = f"https://login.microsoftonline.com/{tenant_id}/discovery/v2.0/keys"
        self.public_keys_cache: Dict[str, Any] = {}
        self.cache_timestamp: Optional[datetime] = None

    async def get_public_keys(self) -> Dict[str, Any]:
        if self.public_keys_cache and self.cache_timestamp:
            age = (datetime.now(timezone.utc) - self.cache_timestamp).total_seconds()
            if age < 3600:
                return self.public_keys_cache

        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(self.jwks_uri) as response:
                    jwks_data = await response.json()
                    keys = {}
                    for key in jwks_data.get("keys", []):
                        keys[key["kid"]] = key
                    self.public_keys_cache = keys
                    self.cache_timestamp = datetime.now(timezone.utc)
                    return keys
        except Exception as e:
            logger.error(f"Error fetching public keys: {e}")
            raise

    async def validate_token(self, token: str) -> Dict:
        try:
            unverified_header = jwt.get_unverified_header(token)
            kid = unverified_header.get("kid")

            if not kid:
                raise HTTPException(status_code=401, detail="Token missing key ID")

            public_keys = await self.get_public_keys()

            if kid not in public_keys:
                # Refresh keys and try again
                self.cache_timestamp = None
                public_keys = await self.get_public_keys()
                if kid not in public_keys:
                    raise HTTPException(status_code=401, detail="Public key not found")

            key_data = public_keys[kid]
            public_key = jwt.algorithms.RSAAlgorithm.from_jwk(key_data)

            decoded = jwt.decode(
                token,
                public_key,
                algorithms=["RS256"],
                audience=self.client_id,
                options={"verify_exp": True}
            )
            return decoded

        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token expired")
        except jwt.InvalidTokenError as e:
            raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")


validator = EntraIDValidator(
    tenant_id=AZURE_AD_TENANT_ID or "",
    client_id=AZURE_AD_CLIENT_ID or ""
)


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict:
    """Validate token and return current user. Returns mock user in DEV_MODE."""
    if DEV_MODE:
        return MOCK_USER

    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        token = credentials.credentials
        payload = await validator.validate_token(token)

        return {
            "oid": payload.get("oid"),
            "email": payload.get("preferred_username") or payload.get("email") or payload.get("upn", ""),
            "name": payload.get("name", ""),
            "roles": payload.get("roles", ["User"]),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token validation error: {e}")
        raise HTTPException(status_code=401, detail="Invalid authentication")


async def get_current_user_optional(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Optional[Dict]:
    """Like get_current_user but returns None instead of raising on failure."""
    if DEV_MODE:
        return MOCK_USER

    if not credentials:
        return None
    try:
        return await get_current_user(credentials)
    except:
        return None
