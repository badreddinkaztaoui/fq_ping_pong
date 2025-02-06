import os
import pyotp
import requests
import urllib.parse
from functools import wraps

from django.db.models import Q
from django.conf import settings
from django.shortcuts import redirect
from django.db import connections
from django.db.utils import OperationalError
from django.contrib.auth import get_user_model, authenticate
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.core.files.storage import default_storage
from .authentication import JWTCookieAuthentication
from django.middleware.csrf import get_token
from django.views.decorators.csrf import csrf_exempt

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, renderer_classes, authentication_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.renderers import JSONRenderer

from rest_framework_simplejwt.tokens import RefreshToken, AccessToken

from .serializers import UserSerializer, FriendshipSerializer, UserFriendSerializer
from .models import Friendship, UserBlock

User = get_user_model()

def csrf_exempt_authentication(view_func):
    @wraps(view_func)
    def wrapped_view(*args, **kwargs):
        return view_func(*args, **kwargs)
    return authentication_classes([])(view_func)

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

def set_jwt_cookies(response, tokens):
    response.set_cookie(
        settings.SIMPLE_JWT['AUTH_COOKIE'],
        tokens['access'],
        max_age=settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds(),
        httponly=settings.SIMPLE_JWT['AUTH_COOKIE_HTTP_ONLY'],
        samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE'],
        secure=settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
        domain=settings.SIMPLE_JWT['AUTH_COOKIE_DOMAIN'],
        path='/'
    )
    
    response.set_cookie(
        settings.SIMPLE_JWT['AUTH_COOKIE_REFRESH'],
        tokens['refresh'],
        max_age=settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds(),
        httponly=settings.SIMPLE_JWT['AUTH_COOKIE_HTTP_ONLY'],
        samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE'],
        secure=settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
        domain=settings.SIMPLE_JWT['AUTH_COOKIE_DOMAIN'],
        path='/'
    )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_access_token(request):
    """
    Returns the access token from cookie for frontend use
    """
    access_token = request.COOKIES.get(settings.SIMPLE_JWT['AUTH_COOKIE'])
    
    if not access_token:
        return Response({
            'error': 'No access token found'
        }, status=status.HTTP_401_UNAUTHORIZED)
    
    return Response({
        'access_token': access_token
    })

@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt_authentication
def login_view(request):
    email = request.data.get('email')
    password = request.data.get('password')
    
    if not email or not password:
        return Response({
            'error': 'Please provide both email and password'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(email=email)
        authenticated_user = authenticate(request, username=user.username, password=password)
        
        if authenticated_user is not None:
            tokens = get_tokens_for_user(authenticated_user)
            csrf_token = get_token(request)
            
            response = Response({
                'message': 'Login successful',
                'user': UserSerializer(authenticated_user).data,
                'csrf_token': csrf_token
            })
            
            set_jwt_cookies(response, tokens)
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
@csrf_exempt_authentication
def register_view(request):
    serializer = UserSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        user.set_password(request.data['password'])
        user.save()
        
        tokens = get_tokens_for_user(user)
        csrf_token = get_token(request)
        
        response = Response({
            'message': 'User registered successfully',
            'user': UserSerializer(user).data,
            'csrf_token': csrf_token
        }, status=status.HTTP_201_CREATED)
        
        set_jwt_cookies(response, tokens)
        return response
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([AllowAny])
def oauth_42_login(request):
    """Initiates the 42 OAuth flow by redirecting to 42's authorization page"""
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
    """Handles the OAuth callback from 42's authorization server"""
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

        tokens = get_tokens_for_user(user)
        success_params = urllib.parse.urlencode({'auth_success': 'true'})
        response = redirect(f'/auth/callback?{success_params}')
        set_jwt_cookies(response, tokens)
        
        return response

    except requests.RequestException as e:
        error_params = urllib.parse.urlencode({'error': 'Failed to authenticate with 42'})
        return redirect(f'/login?{error_params}')


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    response = Response({'message': 'Logged out successfully'})
    
    response.delete_cookie(settings.SIMPLE_JWT['AUTH_COOKIE'])
    response.delete_cookie(settings.SIMPLE_JWT['AUTH_COOKIE_REFRESH'])
    response.delete_cookie('csrftoken')
    
    request.session.flush()
    
    return response

@api_view(['GET'])
@permission_classes([AllowAny])
def me_view(request):
    auth_result = JWTCookieAuthentication().authenticate(request)
    csrf_token = get_token(request)
    
    if auth_result is None:
        return Response({
            'is_authenticated': False,
            'user': None,
            'csrf_token': csrf_token
        }, status=status.HTTP_200_OK)
    
    user, _ = auth_result
    return Response({
        'is_authenticated': True,
        'user': UserSerializer(user).data,
        'csrf_token': csrf_token
    }, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([AllowAny])
def refresh_token(request):
    """
    Refresh access token using refresh token from cookie
    """
    refresh_token = request.COOKIES.get(settings.SIMPLE_JWT['AUTH_COOKIE_REFRESH'])
    
    if not refresh_token:
        return Response({
            'error': 'No refresh token found'
        }, status=status.HTTP_401_UNAUTHORIZED)
    
    try:
        refresh = RefreshToken(refresh_token)
        
        tokens = {
            'access': str(refresh.access_token),
            'refresh': str(refresh)
        }
        
        response = Response({'message': 'Token refresh successful'})
        set_jwt_cookies(response, tokens)
        
        return response
        
    except Exception as e:
        return Response({
            'error': 'Invalid refresh token'
        }, status=status.HTTP_401_UNAUTHORIZED)

@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def verify_token(request):
    """
    Verifies a JWT token and returns the associated user information.
    This endpoint is CSRF exempt because it's used for internal service-to-service
    communication within our Docker network.
    """
    header_token = request.headers.get('Authorization')
    cookie_token = request.COOKIES.get(settings.SIMPLE_JWT['AUTH_COOKIE'])
    
    if not header_token and not cookie_token:
        return Response(
            {'error': 'No token provided'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    try:
        if header_token:
            if not header_token.startswith('Bearer '):
                return Response(
                    {'error': 'Invalid Authorization header format'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            token = header_token.split(' ')[1]
        else:
            token = cookie_token
            
        valid_token = AccessToken(token)
        user_id = valid_token.payload.get('user_id')
        
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        return Response({
            'valid': True,
            'user': UserSerializer(user).data
        })
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_401_UNAUTHORIZED
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def verify_2fa_login(request):
    """Handle 2FA verification with JWT tokens"""
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
        tokens = get_tokens_for_user(user)
        response = Response({
            'message': 'Login successful',
            'user': UserSerializer(user).data
        })
        set_jwt_cookies(response, tokens)
        return response
    
    return Response({
        'error': 'Invalid OTP'
    }, status=status.HTTP_401_UNAUTHORIZED)


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

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_users(request):
    """
    Search for users based on username, display name, or email
    
    Query Parameters:
    - query: Search term (required)
    - exclude_friends: Whether to exclude current friends (optional, default: false)
    - exclude_blocked: Whether to exclude blocked users (optional, default: true)
    - limit: Maximum number of results (optional, default: 10, max: 50)
    """
    query = request.GET.get('query', '').strip()
    
    if not query:
        return Response(
            {'error': 'Search query is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    exclude_friends = request.GET.get('exclude_friends', 'false').lower() == 'true'
    exclude_blocked = request.GET.get('exclude_blocked', 'true').lower() == 'true'
    
    try:
        limit = min(int(request.GET.get('limit', 10)), 50)
    except ValueError:
        limit = 10
    
    users = User.objects.all()
    
    users = users.filter(
        Q(username__icontains=query) | 
        Q(display_name__icontains=query) |
        Q(email__icontains=query)
    )
    
    users = users.exclude(id=request.user.id)
    
    if exclude_friends:
        friend_ids = Friendship.objects.filter(
            (Q(user=request.user) | Q(friend=request.user)),
            is_accepted=True
        ).values_list('user_id', 'friend_id')
        
        friend_ids = set(uid for uid_tuple in friend_ids for uid in uid_tuple)
        users = users.exclude(id__in=friend_ids)
    
    if exclude_blocked:
        blocked_ids = UserBlock.objects.filter(
            Q(user=request.user) | Q(blocked_user=request.user)
        ).values_list('user_id', 'blocked_user_id')
        
        blocked_ids = set(uid for uid_tuple in blocked_ids for uid in uid_tuple)
        users = users.exclude(id__in=blocked_ids)
    
    users = users[:limit]
    serializer = UserFriendSerializer(users, many=True)
    
    enriched_results = []
    for user_data in serializer.data:
        user_id = user_data['id']
        
        friendship = Friendship.objects.filter(
            (Q(user=request.user, friend_id=user_id) |
             Q(user_id=user_id, friend=request.user)),
            is_accepted=True
        ).first()
        
        is_blocked = UserBlock.objects.filter(
            Q(user=request.user, blocked_user_id=user_id) |
            Q(user_id=user_id, blocked_user=request.user)
        ).exists()
        
        enriched_user = user_data.copy()
        enriched_user['is_friend'] = friendship is not None
        enriched_user['friendship_id'] = friendship.id if friendship else None
        enriched_user['is_blocked'] = is_blocked
        
        enriched_results.append(enriched_user)
    
    return Response({
        'results': enriched_results,
        'total': users.count(),
        'query': query
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_friends(request):
    """Get all accepted friends"""
    friendships = Friendship.objects.filter(
        (Q(user=request.user) | Q(friend=request.user)),
        is_accepted=True
    )
    
    friends_list = []
    for friendship in friendships:
        friend = friendship.friend if friendship.user == request.user else friendship.user
        friends_list.append({
            'friendship_id': friendship.id,
            'friend': UserFriendSerializer(friend).data
        })
    
    return Response(friends_list)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_friend_requests(request):
    """Get pending friend requests"""
    pending_requests = Friendship.objects.filter(
        friend=request.user,
        is_accepted=False
    )
    serializer = FriendshipSerializer(pending_requests, many=True, context={'request': request})
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_friend_request(request):
    """Send a friend request to another user"""
    friend_id = request.data.get('friend_id')
    
    if not friend_id:
        return Response(
            {'error': 'friend_id is required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        friend = User.objects.get(id=friend_id)
    except User.DoesNotExist:
        return Response(
            {'error': 'User not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
        
    if friend == request.user:
        return Response(
            {'error': 'Cannot send friend request to yourself'},
            status=status.HTTP_400_BAD_REQUEST
        )
        
    if UserBlock.objects.filter(
        (Q(user=request.user, blocked_user=friend) |
         Q(user=friend, blocked_user=request.user))
    ).exists():
        return Response(
            {'error': 'Cannot send friend request'},
            status=status.HTTP_403_FORBIDDEN
        )
        
    if Friendship.objects.filter(
        (Q(user=request.user, friend=friend) |
         Q(user=friend, friend=request.user))
    ).exists():
        return Response(
            {'error': 'Friendship already exists'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    friendship = Friendship.objects.create(
        user=request.user,
        friend=friend
    )
    
    serializer = FriendshipSerializer(friendship, context={'request': request})
    return Response(serializer.data, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def accept_friend_request(request, friendship_id):
    """Accept a friend request"""
    try:
        friendship = Friendship.objects.get(
            id=friendship_id,
            friend=request.user,
            is_accepted=False
        )
    except Friendship.DoesNotExist:
        return Response(
            {'error': 'Friend request not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    friendship.is_accepted = True
    friendship.save()
    
    serializer = FriendshipSerializer(friendship, context={'request': request})
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reject_friend_request(request, friendship_id):
    """Reject/cancel a friend request"""
    try:
        friendship = Friendship.objects.get(
            Q(friend=request.user) | Q(user=request.user),
            id=friendship_id,
            is_accepted=False
        )
    except Friendship.DoesNotExist:
        return Response(
            {'error': 'Friend request not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    friendship.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def remove_friend(request, friendship_id):
    """Remove an existing friend"""
    try:
        friendship = Friendship.objects.get(
            Q(friend=request.user) | Q(user=request.user),
            id=friendship_id,
            is_accepted=True
        )
    except Friendship.DoesNotExist:
        return Response(
            {'error': 'Friendship not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    friendship.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_friendship_status(request, user_id):
    """Get friendship and block status between two users"""
    try:
        other_user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response(
            {'error': 'User not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    friendship = Friendship.objects.filter(
        (Q(user=request.user, friend=other_user) |
         Q(user=other_user, friend=request.user)),
        is_accepted=True
    ).first()
    
    is_blocked = UserBlock.objects.filter(
        Q(user=request.user, blocked_user=other_user) |
        Q(user=other_user, blocked_user=request.user)
    ).exists()
    
    return Response({
        'is_friend': friendship is not None,
        'friendship_id': friendship.id if friendship else None,
        'is_blocked': is_blocked
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def block_user(request):
    """Block a user"""
    user_id = request.data.get('user_id')
    
    if not user_id:
        return Response(
            {'error': 'user_id is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        blocked_user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response(
            {'error': 'User not found'},
            status=status.HTTP_404_NOT_FOUND
        )
        
    if blocked_user == request.user:
        return Response(
            {'error': 'Cannot block yourself'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    Friendship.objects.filter(
        (Q(user=request.user, friend=blocked_user) |
         Q(user=blocked_user, friend=request.user))
    ).delete()
    
    block, created = UserBlock.objects.get_or_create(
        user=request.user,
        blocked_user=blocked_user
    )
    
    return Response(status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def unblock_user(request, user_id):
    """Unblock a user"""
    try:
        block = UserBlock.objects.get(
            user=request.user,
            blocked_user_id=user_id
        )
        block.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    except UserBlock.DoesNotExist:
        return Response(
            {'error': 'Block not found'},
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_blocked_users(request):
    """Get list of blocked users"""
    blocks = UserBlock.objects.filter(user=request.user)
    blocked_users = [block.blocked_user for block in blocks]
    serializer = UserFriendSerializer(blocked_users, many=True)
    return Response(serializer.data)

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
    """Basic health check endpoint that verifies database connection"""
    health_status = {
        'status': 'healthy',
        'database': 'unavailable',
        'auth_type': 'JWT'
    }

    try:
        connections['default'].ensure_connection()
        health_status['database'] = 'available'
    except OperationalError:
        health_status['status'] = 'unhealthy'
        health_status['database'] = 'unavailable'

    response_status = status.HTTP_200_OK if health_status['status'] == 'healthy' else status.HTTP_503_SERVICE_UNAVAILABLE

    return Response(health_status, status=response_status)