import os
import redis
import psutil
import requests
from urllib.parse import urlencode
from django.conf import settings
from django.db import connections
from django.db.utils import OperationalError
from django.shortcuts import redirect
from django.contrib.auth import authenticate, get_user_model
from rest_framework import status, views
from rest_framework.decorators import api_view, permission_classes, renderer_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.renderers import JSONRenderer
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import UserSerializer, SignUpSerializer, LoginSerializer

User = get_user_model()

class SignUpView(views.APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = SignUpSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'user': UserSerializer(user).data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(views.APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = authenticate(
                email=serializer.validated_data['email'],
                password=serializer.validated_data['password']
            )
            
            if user:
                refresh = RefreshToken.for_user(user)
                return Response({
                    'user': UserSerializer(user).data,
                    'tokens': {
                        'refresh': str(refresh),
                        'access': str(refresh.access_token),
                    }
                })
            return Response(
                {'error': 'Invalid credentials'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([AllowAny])
def oauth_42_login(request):
    """Initiates 42 OAuth flow"""
    oauth_url = 'https://api.intra.42.fr/oauth/authorize'
    params = {
        'client_id': settings.SOCIAL_AUTH_42_KEY,
        'redirect_uri': f"{settings.SITE_URL}/api/auth/42/callback",
        'response_type': 'code',
        'scope': 'public'
    }
    authorization_url = f"{oauth_url}?{urlencode(params)}"
    return redirect(authorization_url)

@api_view(['GET'])
@permission_classes([AllowAny])
def oauth_42_callback(request):
    """Handles 42 OAuth callback"""
    code = request.GET.get('code')
    
    if not code:
        return Response(
            {'error': 'Authorization code not provided'}, 
            status=status.HTTP_400_BAD_REQUEST
        )

    token_url = 'https://api.intra.42.fr/oauth/token'
    token_data = {
        'grant_type': 'authorization_code',
        'client_id': settings.SOCIAL_AUTH_42_KEY,
        'client_secret': settings.SOCIAL_AUTH_42_SECRET,
        'code': code,
        'redirect_uri': f"{settings.SITE_URL}/api/auth/42/callback"
    }
    
    token_response = requests.post(token_url, data=token_data)
    
    if token_response.status_code != 200:
        return Response(
            {'error': 'Failed to obtain access token'}, 
            status=status.HTTP_400_BAD_REQUEST
        )

    access_token = token_response.json().get('access_token')
    
    user_info_response = requests.get(
        'https://api.intra.42.fr/v2/me',
        headers={'Authorization': f'Bearer {access_token}'}
    )
    
    if user_info_response.status_code != 200:
        return Response(
            {'error': 'Failed to get user info'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
        
    user_info = user_info_response.json()
    
    try:
        user = User.objects.get(email=user_info['email'])
    except User.DoesNotExist:
        user = User.objects.create_user(
            email=user_info['email'],
            username=user_info['login'],
            display_name=user_info['displayname'],
            avatar_url=user_info.get('image_url')
        )
    
    refresh = RefreshToken.for_user(user)
    
    # Redirect to frontend with tokens
    redirect_url = f"{settings.SITE_URL}/oauth/callback?access={str(refresh.access_token)}&refresh={str(refresh)}"
    return redirect(redirect_url)

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