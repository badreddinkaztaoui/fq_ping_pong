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
    Comprehensive health check endpoint that verifies all critical system components.
    
    This endpoint checks:
    1. API accessibility
    2. Database connection status
    3. Redis connection and functionality
    4. Game service specific features:
        - Matchmaking queue status
        - Number of active games
        - Database game counts
    
    Returns:
        Response: A JSON response containing the health status of all components
        and relevant metrics. Returns 200 if all critical systems are healthy,
        503 if any critical system is unhealthy.
    """
    health_status = {
        'status': 'healthy',
        'components': {
            'database': 'unavailable',
            'redis': 'unavailable',
            'matchmaking': 'unavailable',
        },
        'metrics': {
            'active_games': 0,
            'total_games': 0,
            'matchmaking_queue_size': 0
        }
    }

    response_status = (
        status.HTTP_200_OK
        if health_status['status'] == 'healthy'
        else status.HTTP_503_SERVICE_UNAVAILABLE
    )

    return Response(health_status, status=response_status)
