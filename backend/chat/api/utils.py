import aiohttp
from django.conf import settings
from typing import Optional, Dict

class AuthServiceError(Exception):
    """Custom exception for auth service communication errors"""
    pass

async def verify_token_with_auth_service(token: str) -> Optional[Dict]:
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(
                settings.JWT_VERIFICATION_URL,
                headers={'Authorization': f'Bearer {token}'},
                timeout=aiohttp.ClientTimeout(total=10)
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get('valid') and data.get('user'):
                        return data['user']
                    return None
                elif response.status == 401:
                    return None
                else:
                    raise AuthServiceError(f"Auth service returned status {response.status}")
    except aiohttp.ClientError as e:
        raise AuthServiceError(f"Failed to communicate with auth service: {str(e)}")