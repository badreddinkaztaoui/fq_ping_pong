from datetime import timedelta
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
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from django.core.exceptions import ObjectDoesNotExist
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from .serializers import UserSerializer
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
import pyotp

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
                is_42_user=True,
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
    """Handle user login and session creation with 2FA support"""
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
            if authenticated_user.is_2fa_enabled:
                secret = authenticated_user.otp_secret
                if not secret:
                    secret = pyotp.random_base32()
                    authenticated_user.otp_secret = secret
                    authenticated_user.save()
                
                totp = pyotp.TOTP(secret, interval=300)
                current_otp = totp.now()
                
                send_mail(
                    subject='Your Login Verification Code',
                    message=f'Your verification code is: {current_otp}\n\nThis code will expire in 5 minutes.',
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[authenticated_user.email],
                    fail_silently=False,
                )
                
                return Response({
                    'requires_2fa': True,
                    'user_id': authenticated_user.id,
                    'message': 'Please check your email for the verification code'
                }, status=status.HTTP_200_OK)
            
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
@permission_classes([AllowAny])
def verify_2fa_login(request):
    user_id = request.data.get('user_id')
    otp = request.data.get('otp')
    
    if not user_id or not otp:
        return Response({
            'error': 'Please provide both user_id and OTP'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({
            'error': 'User not found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    if not user.otp_secret:
        return Response({
            'error': 'No OTP secret found for user'
        }, status=status.HTTP_400_BAD_REQUEST)

    totp = pyotp.TOTP(user.otp_secret, interval=300)
    
    if totp.verify(otp, valid_window=1):
        login(request, user)
        return Response({
            'message': 'Login successful',
            'user': UserSerializer(user).data
        })
    else:
        return Response({
            'error': 'Invalid OTP'
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

@api_view(['POST'])
@permission_classes([AllowAny])
def verify_token(request):
    """
    Verifies a JWT token and returns the associated user information.
    This endpoint is primarily used by other microservices to validate tokens
    and get user details.
    """
    token = request.headers.get('Authorization')
    
    if not token or not token.startswith('Bearer '):
        return Response(
            {'error': 'Authorization header must be provided with Bearer token'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    try:
        token = token.split(' ')[1]
        
        access_token = AccessToken(token)
        user_id = access_token.payload.get('user_id')
        
        try:
            user = User.objects.get(id=user_id)
        except ObjectDoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        return Response({
            'valid': True,
            'user': UserSerializer(user).data
        })
        
    except TokenError as e:
        return Response(
            {'error': 'Token is invalid or expired'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    except InvalidToken as e:
        return Response(
            {'error': 'Token is invalid'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    except Exception as e:
        return Response(
            {'error': 'An error occurred while verifying the token'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
@api_view(['GET'])
@authentication_classes([SessionAuthentication])
@permission_classes([IsAuthenticated])
def get_ws_token(request):
    """
    Generate a short-lived JWT token for WebSocket authentication.
    This endpoint is called by authenticated users (with valid session)
    to get a JWT token for WebSocket connections.
    """
    try:
        # Create a token with shorter lifetime for WebSocket
        token = AccessToken.for_user(request.user)
        
        # Set a shorter lifetime (e.g., 1 hour) for WebSocket tokens
        token.set_exp(lifetime=timedelta(hours=1))
        
        # Include basic user info in token payload
        token['username'] = request.user.username
        token['display_name'] = request.user.display_name
        
        return Response({
            'token': str(token),
            'expires_in': 3600
        })
    except Exception as e:
        return Response(
            {'error': 'Failed to generate WebSocket token'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_user(request):
    if 'new_password' in request.data:
        current_password = request.data.get('current_password')
        if not current_password:
            return Response(
                {'error': 'Current password is required to change password'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not request.user.check_password(current_password):
            return Response(
                {'error': 'Current password is incorrect'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        request.user.set_password(request.data['new_password'])
        request.user.save()
        
        update_data = request.data.copy()
        update_data.pop('new_password', None)
        update_data.pop('current_password', None)
    else:
        update_data = request.data

    serializer = UserSerializer(request.user, data=update_data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response({
            **serializer.data,
            'message': 'Profile updated successfully'
        })
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_avatar(request):
    if 'avatar' not in request.FILES:
        return Response({'error': 'No avatar file provided'}, status=status.HTTP_400_BAD_REQUEST)

    avatar_file = request.FILES['avatar']
    
    try:
        media_dir = os.path.join(settings.MEDIA_ROOT, 'avatars')
        os.makedirs(media_dir, exist_ok=True)
        os.chmod(media_dir, 0o777)
        
        file_ext = os.path.splitext(avatar_file.name)[1].lower()
        filename = f"avatars/{request.user.id}_avatar{file_ext}"
        
        path = default_storage.save(filename, avatar_file)
        full_url = request.build_absolute_uri(settings.MEDIA_URL + path)
        
        request.user.avatar_url = full_url
        request.user.save()

        return Response({'avatar_url': full_url})

    except Exception as e:
        return Response(
            {'error': 'Failed to save avatar'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password_request(request):
    email = request.data.get('email')
    user = User.objects.filter(email=email).first()
    if user:
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        reset_link = f"{settings.SITE_URL}/reset-password/{uid}/{token}/"
        send_mail(
            'Password Reset',
            f'Click here to reset your password: {reset_link}',
            settings.DEFAULT_FROM_EMAIL,
            [email],
            fail_silently=False,
        )
    return Response({"message": "If an account exists, a password reset link has been sent."})

@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password_confirm(request, uidb64, token):
    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = User.objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        user = None
    
    if user and default_token_generator.check_token(user, token):
        new_password = request.data.get('new_password')
        user.set_password(new_password)
        user.save()
        return Response({"message": "Password has been reset successfully."})
    return Response({"error": "Invalid reset link"}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def enable_2fa(request):
    try:
        secret = pyotp.random_base32()
        
        totp = pyotp.TOTP(secret, interval=300)
        
        current_otp = totp.now()
        
        request.user.otp_secret = secret
        request.user.save()
        
        send_mail(
            subject='Your Two-Factor Authentication Code',
            message=f'Your verification code is: {current_otp}\n\nThis code will expire in 5 minutes.',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[request.user.email],
            fail_silently=False,
        )
        
        return Response({
            "message": "Verification code sent to your email. You have 5 minutes to enter the code."
        })
        
    except Exception as e:
        print(f"2FA Enable Error: {str(e)}")
        return Response(
            {"error": "Failed to enable 2FA. Please try again."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_2fa(request):
    try:
        otp = request.data.get('otp')
        if not otp:
            return Response(
                {"error": "OTP code is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if not request.user.otp_secret:
            return Response(
                {"error": "2FA setup not initiated"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        totp = pyotp.TOTP(request.user.otp_secret, interval=300)
        if totp.verify(otp):
            request.user.is_2fa_enabled = True
            request.user.save()
            return Response({"message": "2FA verified successfully"})
            
        return Response(
            {"error": "Invalid OTP code"},
            status=status.HTTP_400_BAD_REQUEST
        )
        
    except Exception as e:
        print(f"2FA Verify Error: {str(e)}")
        return Response(
            {"error": "Failed to verify 2FA. Please try again."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def disable_2fa(request):
    request.user.is_2fa_enabled = False
    request.user.otp_secret = None
    request.user.save()
    return Response({"message": "2FA disabled successfully"})

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