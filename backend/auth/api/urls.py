from django.urls import path, include
from .views import (
    health_check,
    register_view,
    login_view,
    logout_view,
    me_view,
    oauth_42_login,
    oauth_42_callback,
    verify_token,
    update_user,
    update_avatar,
    reset_password_confirm,
    enable_2fa,
    verify_2fa,
    reset_password_request,
    disable_2fa,
    verify_2fa_login,
    get_ws_token,
    get_friends,
    get_friend_requests,
    get_friendship_status,
    send_friend_request,
    accept_friend_request,
    reject_friend_request,
    remove_friend,
    get_blocked_users,
    block_user,
    unblock_user,
    search_users
)

urlpatterns = [
    path('auth/', include([
        # Health check
        path('health/', health_check, name='health_check'),
        
        # Authentication endpoints
        path('register/', register_view, name='register'),
        path('login/', login_view, name='login'),
        path('logout/', logout_view, name='logout'),
        path('me/', me_view, name='me'),
        path('verify/', verify_token, name='verify_token'),
        path('ws-token/', get_ws_token, name='get_ws_token'),
        path('search/', search_users, name='search_users'),
        
        # OAuth endpoints
        path('42/login/', oauth_42_login, name='oauth_42_login'),
        path('42/callback/', oauth_42_callback, name='oauth_42_callback'),
        
        # Profile management
        path('update/', update_user, name='update_user'),
        path('update-avatar/', update_avatar, name='update_avatar'),
        
        # Password reset
        path('reset-password/', reset_password_request, name='reset_password_request'),
        path('reset-password/<str:uidb64>/<str:token>/', reset_password_confirm, name='reset_password_confirm'),
        
        # 2FA management
        path('enable-2fa/', enable_2fa, name='enable_2fa'),
        path('verify-2fa/', verify_2fa, name='verify_2fa'),
        path('disable-2fa/', disable_2fa, name='disable_2fa'),
        path('verify-2fa-login/', verify_2fa_login, name='verify_2fa_login'),
        
        # Friendship management
        path('friends/', include([
            path('', get_friends, name='get_friends'),
            path('requests/', get_friend_requests, name='get_friend_requests'),
            path('request/', send_friend_request, name='send_friend_request'),
            path('accept/<uuid:friendship_id>/', accept_friend_request, name='accept_friend_request'),
            path('reject/<uuid:friendship_id>/', reject_friend_request, name='reject_friend_request'),
            path('remove/<uuid:friendship_id>/', remove_friend, name='remove_friend'),
            path('status/<uuid:user_id>/', get_friendship_status, name='get_friendship_status'),
        ])),
        
        # Block management
        path('blocks/', include([
            path('', get_blocked_users, name='get_blocked_users'),
            path('block/', block_user, name='block_user'),
            path('unblock/<uuid:user_id>/', unblock_user, name='unblock_user'),
        ])),
    ])),
]