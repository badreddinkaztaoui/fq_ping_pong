from django.db import connections
from django.db.utils import OperationalError
from rest_framework import status
from rest_framework.decorators import (
    api_view,
    permission_classes,
    renderer_classes
)
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.renderers import JSONRenderer
from django_redis import get_redis_connection

@api_view(['GET'])
@permission_classes([AllowAny])
@renderer_classes([JSONRenderer])
def health_check(request):
    """
    Health check endpoint that verifies:
    1. The API is accessible
    2. Database connection is working
    3. Redis connection is working (crucial for game state and matchmaking)
    4. Game service specific checks (matchmaking queue, active games)
    """
    health_status = {
        'status': 'healthy',
        'database': 'unavailable',
        'redis': 'unavailable',
        'matchmaking': 'unavailable',
        'active_games': 0
    }

    try:
        connections['default'].ensure_connection()
        health_status['database'] = 'available'
    except OperationalError:
        health_status['status'] = 'unhealthy'

    try:
        redis_client = get_redis_connection("default")
        redis_client.ping()
        health_status['redis'] = 'available'
        
        if redis_client.exists('matchmaking_queue'):
            health_status['matchmaking'] = 'available'
            
        active_games = redis_client.scard('active_games')
        health_status['active_games'] = active_games
        
    except Exception:
        health_status['status'] = 'unhealthy'

    response_status = (
        status.HTTP_200_OK
        if health_status['status'] == 'healthy'
        else status.HTTP_503_SERVICE_UNAVAILABLE
    )

    return Response(health_status, status=response_status)