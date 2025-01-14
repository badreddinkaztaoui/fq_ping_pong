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
            
            if user is not None:
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
    redirect_uri = settings.OAUTH2_REDIRECT_URL.rstrip('/')
    params = {
        'client_id': settings.OAUTH2_CLIENT_ID,
        'redirect_uri': redirect_uri,
        'response_type': 'code',
        'scope': settings.OAUTH2_SCOPE,
    }
    
    print("Full OAuth params:", params)
    auth_url = f"{settings.OAUTH2_AUTHORIZATION_URL}?{urlencode(params)}"
    print("Full auth URL:", auth_url)
    return redirect(auth_url)

@api_view(['GET'])
@permission_classes([AllowAny])
def oauth_42_callback(request):
    """
    Handles the OAuth 2.0 callback from 42
    """
    code = request.GET.get('code')
    if not code:
        return Response(
            {'error': 'No authorization code provided'}, 
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        # Exchange authorization code for access token
        token_response = requests.post(
            settings.OAUTH2_TOKEN_URL,
            data={
                'client_id': settings.OAUTH2_CLIENT_ID,
                'client_secret': settings.OAUTH2_CLIENT_SECRET,
                'code': code,
                'redirect_uri': settings.OAUTH2_REDIRECT_URL,
                'grant_type': 'authorization_code',
            },
            headers={'Accept': 'application/json'}
        )
        token_data = token_response.json()

        if 'access_token' not in token_data:
            return Response(
                {'error': 'Failed to obtain access token'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get user info from 42 API
        user_response = requests.get(
            'https://api.intra.42.fr/v2/me',
            headers={'Authorization': f"Bearer {token_data['access_token']}"}
        )
        user_data = user_response.json()

        # Get or create user
        email = user_data.get('email')
        if not email:
            return Response(
                {'error': 'Email not provided by 42 API'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create or update user
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'username': user_data.get('login'),
                'display_name': user_data.get('displayname', user_data.get('login')),
                'avatar_url': user_data.get('image', {}).get('link'),  # Updated path to image URL
            }
        )

        if not created:
            # Update existing user data
            user.display_name = user_data.get('displayname', user_data.get('login'))
            user.avatar_url = user_data.get('image', {}).get('link')
            user.save()

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        })

    except requests.exceptions.RequestException as e:
        return Response(
            {'error': f'Failed to authenticate: {str(e)}'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_400_BAD_REQUEST
        )

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