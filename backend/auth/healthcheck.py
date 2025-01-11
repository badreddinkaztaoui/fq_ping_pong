import sys
from django.core.management import execute_from_command_line
from django.db import connections
from django.db.utils import OperationalError
import redis
from django.conf import settings
import os

def check_database():
    try:
        connections['default'].ensure_connection()
        return True
    except OperationalError:
        return False

def check_redis():
    try:
        redis_client = redis.Redis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            password=settings.REDIS_PASSWORD,
            socket_timeout=5
        )
        redis_client.ping()
        return True
    except redis.RedisError:
        return False

if __name__ == "__main__":
    # Run database check
    if not check_database():
        sys.exit(1)
    
    # Run Redis check
    if not check_redis():
        sys.exit(1)
    
    sys.exit(0)