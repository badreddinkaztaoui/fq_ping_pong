from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q
from django.conf import settings
from django.db import connections
from django.db.utils import OperationalError
import aiohttp
import asyncio
from rest_framework.renderers import JSONRenderer

class ChatHealthCheck(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    renderer_classes = [JSONRenderer]
    
    def get(self, request):
        health_status = {
            'status': 'healthy',
            'database': 'unavailable',
            'auth_service': 'unavailable'
        }

        try:
            connections['default'].ensure_connection()
            health_status['database'] = 'available'
        except OperationalError:
            health_status['status'] = 'unhealthy'
            health_status['database_message'] = 'Database connection failed'

        try:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            auth_status, auth_message = loop.run_until_complete(self.check_auth_service())
            loop.close()

            health_status['auth_service'] = 'available' if auth_status else 'unavailable'
            if not auth_status:
                health_status['status'] = 'unhealthy'
                health_status['auth_message'] = auth_message
        except Exception as e:
            health_status['status'] = 'unhealthy'
            health_status['auth_service'] = 'unavailable'
            health_status['auth_message'] = f'Error checking auth service: {str(e)}'

        response_status = (
            status.HTTP_200_OK 
            if health_status['status'] == 'healthy' 
            else status.HTTP_503_SERVICE_UNAVAILABLE
        )
        
        return Response(health_status, status=response_status)

    async def check_auth_service(self):
        timeout = aiohttp.ClientTimeout(total=settings.AUTH_SERVICE_TIMEOUT)
        try:
            async with aiohttp.ClientSession(timeout=timeout) as session:
                async with session.get(f"{settings.AUTH_SERVICE_URL}/api/auth/health/") as response:
                    if response.status == 200:
                        return True, await response.json()
                    return False, f'Auth service returned status {response.status}'
        except aiohttp.ClientConnectorError as e:
            return False, f'Connection to auth service failed: {str(e)}'
        except asyncio.TimeoutError:
            return False, 'Auth service connection timed out'
        except Exception as e:
            return False, f'Failed to connect to auth service: {str(e)}'

