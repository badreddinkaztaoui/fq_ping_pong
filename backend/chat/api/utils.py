import aiohttp
from django.conf import settings
from typing import Optional, Dict

class AuthServiceError(Exception):
    """Custom exception for auth service communication errors"""
    pass

async def verify_token_with_auth_service(token: str) -> Optional[Dict]:
    """
    Verify a JWT token with the auth service. This function supports both cookie-based
    and header-based token verification for maximum compatibility.
    """
    try:
        async with aiohttp.ClientSession() as session:
            headers = {'Authorization': f'Bearer {token}'}
            cookies = {settings.SIMPLE_JWT['AUTH_COOKIE']: token}
            
            async with session.post(
                settings.JWT_VERIFICATION_URL,
                headers=headers,
                cookies=cookies,
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

async def get_auth_headers(token: str) -> Dict[str, str]:
    """
    Helper function to generate authentication headers for service-to-service communication
    """
    return {
        'Authorization': f'Bearer {token}',
        'Cookie': f"{settings.SIMPLE_JWT['AUTH_COOKIE']}={token}"
    }