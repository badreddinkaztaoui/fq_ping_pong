import aiohttp
from django.conf import settings
from typing import Optional, Dict

class AuthServiceError(Exception):
    """Custom exception for auth service communication errors"""
    pass

async def verify_token_with_auth_service(token: str) -> Optional[Dict]:
    """
    Verifies a JWT token with the auth service and returns user data if valid.
    
    Args:
        token: The JWT token to verify
        
    Returns:
        dict: User data if token is valid
        None: If token is invalid
        
    Raises:
        AuthServiceError: If there's an error communicating with the auth service
    """
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                settings.JWT_VERIFICATION_URL,
                headers={'Authorization': f'Bearer {token}'},
                timeout=aiohttp.ClientTimeout(total=10)
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get('user')
                elif response.status == 401:
                    return None
                else:
                    print(f"Auth service error: Status {response.status}")
                    raise AuthServiceError(f"Auth service returned status {response.status}")
                    
    except aiohttp.ClientError as e:
        print(f"Auth service connection error: {str(e)}")
        raise AuthServiceError(f"Failed to communicate with auth service: {str(e)}")