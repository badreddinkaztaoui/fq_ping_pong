from rest_framework.decorators import api_view, permission_classes, renderer_classes
from rest_framework.renderers import JSONRenderer
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.db import connections
from django.db.utils import OperationalError
import redis
from django.conf import settings
import psutil
import os

@api_view(['GET'])
@permission_classes([AllowAny])
@renderer_classes([JSONRenderer])
def health_check(request):
    """
    A comprehensive health check endpoint that verifies critical system components
    """
    health_status = {
        'status': 'healthy',
        'database': 'unavailable',
        'redis': 'unavailable',
        'system': {
            'cpu_usage': None,
            'memory_usage': None,
        }
    }

    try:
        connections['default'].ensure_connection()
        health_status['database'] = 'available'
    except OperationalError:
        health_status['status'] = 'unhealthy'
        health_status['database'] = 'unavailable'

    try:
        redis_client = redis.Redis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            password=settings.REDIS_PASSWORD,
            socket_timeout=5
        )
        redis_client.ping()
        health_status['redis'] = 'available'
    except (redis.RedisError, AttributeError):
        health_status['redis'] = 'unavailable'

    try:
        health_status['system'] = {
            'cpu_usage': psutil.cpu_percent(interval=1),
            'memory_usage': psutil.virtual_memory().percent,
            'process_id': os.getpid()
        }
    except Exception as e:
        health_status['system'] = {
            'error': str(e)
        }

    response_status = status.HTTP_200_OK if health_status['status'] == 'healthy' else status.HTTP_503_SERVICE_UNAVAILABLE

    return Response(health_status, status=response_status)