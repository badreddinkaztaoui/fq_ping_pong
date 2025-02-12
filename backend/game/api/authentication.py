from rest_framework_simplejwt.authentication import JWTAuthentication
from django.conf import settings
from rest_framework import exceptions
import aiohttp
import asyncio

class SimpleUser:
    def __init__(self, user_data):
        self.id = user_data.get('id')
        self.username = user_data.get('username')
        self.is_authenticated = True
        for key, value in user_data.items():
            setattr(self, key, value)

class GameJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        token = request.COOKIES.get(settings.SIMPLE_JWT['AUTH_COOKIE'])
        
        if not token:
            header = self.get_header(request)
            if header:
                token = self.get_raw_token(header)

        if not token:
            return None

        try:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
            user_data = loop.run_until_complete(self.verify_token(request, token))
            loop.close()
            
            if user_data:
                user = SimpleUser(user_data)
                request.token = token
                return (user, None)
            return None
            
        except Exception as e:
            raise exceptions.AuthenticationFailed(str(e))

    async def verify_token(self, request, token):
        """Verify token with auth service"""
        try:
            csrf_token = request.COOKIES.get('csrftoken')
            
            async with aiohttp.ClientSession() as session:
                headers = {
                    'Authorization': f'Bearer {token}',
                    'Origin': 'http://localhost:8000',
                }
                
                if csrf_token:
                    headers['X-CSRFToken'] = csrf_token
                
                cookies = {
                    settings.SIMPLE_JWT['AUTH_COOKIE']: token,
                }
                
                if csrf_token:
                    cookies['csrftoken'] = csrf_token
                
                async with session.post(
                    settings.JWT_VERIFICATION_URL,
                    headers=headers,
                    cookies=cookies,
                    timeout=aiohttp.ClientTimeout(total=settings.AUTH_SERVICE_TIMEOUT)
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        if data.get('valid') and data.get('user'):
                            return data['user']
                    elif response.status == 403:
                        error_text = await response.text()
                        print(f"Verification failed - Status: {response.status}")
                        print(f"Headers: {response.headers}")
                        print(f"Response: {error_text}")
                    return None
                    
        except aiohttp.ClientError as e:
            raise exceptions.AuthenticationFailed(f'Auth service error: {str(e)}')