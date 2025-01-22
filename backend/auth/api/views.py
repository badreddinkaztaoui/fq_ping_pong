import os
import requests
import urllib.parse
from django.conf import settings
from django.shortcuts import redirect
from django.db import connections
from django.db.utils import OperationalError
from django.contrib.auth import get_user_model, login, logout, authenticate
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, renderer_classes, authentication_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.renderers import JSONRenderer
from django.middleware.csrf import get_token
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import IsAuthenticated
from .serializers import UserSerializer

User = get_user_model()

@api_view(['GET'])
@permission_classes([AllowAny])
def oauth_42_login(request):
    """
    Initiates the 42 OAuth flow by redirecting to 42's authorization page
    """
    authorization_url = (
        f"{settings.OAUTH2_AUTHORIZATION_URL}"
        f"?client_id={settings.SOCIAL_AUTH_42_KEY}"
        f"&redirect_uri={settings.OAUTH2_REDIRECT_URL}"
        f"&response_type=code"
        f"&scope={settings.OAUTH2_SCOPE}"
    )
    return Response({'authorization_url': authorization_url})

@api_view(['GET'])
@permission_classes([AllowAny])
def oauth_42_callback(request):
    """
    Handles the OAuth callback from 42's authorization server
    """
    code = request.GET.get('code')
    error = request.GET.get('error')

    if error:
        error_params = urllib.parse.urlencode({'error': error})
        return redirect(f'/login?{error_params}')

    if not code:
        return redirect('/login?error=no_code')

    try:
        token_response = requests.post(
            settings.OAUTH2_TOKEN_URL,
            data={
                'grant_type': 'authorization_code',
                'client_id': settings.SOCIAL_AUTH_42_KEY,
                'client_secret': settings.SOCIAL_AUTH_42_SECRET,
                'code': code,
                'redirect_uri': settings.OAUTH2_REDIRECT_URL
            }
        )
        token_data = token_response.json()

        if 'error' in token_data:
            error_params = urllib.parse.urlencode({'error': token_data['error']})
            return redirect(f'/login?{error_params}')

        user_info_response = requests.get(
            'https://api.intra.42.fr/v2/me',
            headers={'Authorization': f"Bearer {token_data['access_token']}"}
        )
        user_info = user_info_response.json()

        User = get_user_model()
        try:
            user = User.objects.get(email=user_info['email'])
            user.avatar_url = user_info['image']['link']
            user.save()
        except User.DoesNotExist:
            user = User.objects.create_user(
                email=user_info['email'],
                username=f"42_{user_info['login']}",
                display_name=user_info['displayname'],
                avatar_url=user_info['image']['link'],
                password=None 
            )

        login(request, user)
        
        success_params = urllib.parse.urlencode({
            'auth_success': 'true',
            'session_id': request.session.session_key
        })
        
        return redirect(f'/auth/callback?{success_params}')

    except requests.RequestException as e:
        error_params = urllib.parse.urlencode({'error': 'Failed to authenticate with 42'})
        return redirect(f'/login?{error_params}')

@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    """Handle user registration"""
    serializer = UserSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        user.set_password(request.data['password'])
        user.save()
        
        return Response({
            'message': 'User registered successfully',
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """Handle user login and session creation"""
    email = request.data.get('email')
    password = request.data.get('password')
    
    if not email or not password:
        return Response({
            'error': 'Please provide both email and password'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(email=email)
        
        authenticated_user = authenticate(
            request, 
            username=user.username,
            password=password
        )
        
        if authenticated_user is not None:
            login(request, authenticated_user)
            
            response = Response({
                'message': 'Login successful',
                'user': UserSerializer(authenticated_user).data,
                'csrf_token': get_token(request)
            })
            
            response.set_cookie(
                settings.SESSION_COOKIE_NAME,
                request.session.session_key,
                max_age=settings.SESSION_COOKIE_AGE,
                httponly=True,
                samesite=settings.SESSION_COOKIE_SAMESITE,
                secure=settings.SESSION_COOKIE_SECURE
            )
            
            return response
            
        return Response({
            'error': 'Invalid credentials'
        }, status=status.HTTP_401_UNAUTHORIZED)
        
    except User.DoesNotExist:
        return Response({
            'error': 'No user found with this email'
        }, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['POST'])
def logout_view(request):
    """Handle user logout"""
    logout(request)
    
    response = Response({'message': 'Logged out successfully'})
    response.delete_cookie(settings.SESSION_COOKIE_NAME)
    
    return response

@api_view(['GET'])
@authentication_classes([SessionAuthentication])
@permission_classes([IsAuthenticated])
def me_view(request):
    """Get current authenticated user information"""
    serializer = UserSerializer(request.user)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([AllowAny])
@renderer_classes([JSONRenderer])
def health_check(request):
    """
    Basic health check endpoint that verifies database connection
    """
    health_status = {
        'status': 'healthy',
        'database': 'unavailable',
    }

    try:
        connections['default'].ensure_connection()
        health_status['database'] = 'available'
    except OperationalError:
        health_status['status'] = 'unhealthy'
        health_status['database'] = 'unavailable'

    response_status = status.HTTP_200_OK if health_status['status'] == 'healthy' else status.HTTP_503_SERVICE_UNAVAILABLE

    return Response(health_status, status=response_status)