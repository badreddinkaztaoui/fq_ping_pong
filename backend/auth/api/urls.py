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
    refresh_token,
    update_user,
    update_avatar,
    reset_password_confirm,
    enable_2fa,
    verify_2fa,
    reset_password_request,
    disable_2fa,
    verify_2fa_login,
    get_friends,
    get_friend_requests,
    get_friendship_status,
    send_friend_request,
    accept_friend_request,
    reject_friend_request,
    get_blocked_users,
    get_access_token,
    block_user,
    unblock_user,
    search_users,
    update_online_status,
    get_notifications,
    mark_notification_read,
    mark_all_read,
    get_unread_count,
    clear_notification,
    clear_all_notifications,
    get_user_by_id
)

urlpatterns = [
    path('auth/', include([
        # Existing authentication routes
        path('health/', health_check, name='health_check'),
        path('register/', register_view, name='register'),
        path('login/', login_view, name='login'),
        path('logout/', logout_view, name='logout'),
        path('me/', me_view, name='me'),
        path('users/<uuid:user_id>/', get_user_by_id, name='get_user_by_id'),
        path('verify/', verify_token, name='verify_token'),
        path('token/', get_access_token, name='get_access_token'),
        path('refresh-token/', refresh_token, name='refresh_token'),
        path('search/', search_users, name='search_users'),
        
        # OAuth routes
        path('42/login/', oauth_42_login, name='oauth_42_login'),
        path('42/callback/', oauth_42_callback, name='oauth_42_callback'),
        
        # Profile update routes
        path('update/', update_user, name='update_user'),
        path('update-avatar/', update_avatar, name='update_avatar'),
        
        # Password reset routes
        path('reset-password/', reset_password_request, name='reset_password_request'),
        path('reset-password/<str:uidb64>/<str:token>/', reset_password_confirm, name='reset_password_confirm'),
        
        # 2FA routes
        path('enable-2fa/', enable_2fa, name='enable_2fa'),
        path('verify-2fa/', verify_2fa, name='verify_2fa'),
        path('disable-2fa/', disable_2fa, name='disable_2fa'),
        path('verify-2fa-login/', verify_2fa_login, name='verify_2fa_login'),
        
        # Friends routes
        path('friends/', include([
            path('', get_friends, name='get_friends'),
            path('requests/', get_friend_requests, name='get_friend_requests'),
            path('request/', send_friend_request, name='send_friend_request'),
            path('accept/<uuid:friendship_id>/', accept_friend_request, name='accept_friend_request'),
            path('reject/<uuid:friendship_id>/', reject_friend_request, name='reject_friend_request'),
            path('status/<uuid:user_id>/', get_friendship_status, name='get_friendship_status'),
        ])),
        
        # Blocks routes
        path('blocks/', include([
            path('', get_blocked_users, name='get_blocked_users'),
            path('block/', block_user, name='block_user'),
            path('unblock/<uuid:user_id>/', unblock_user, name='unblock_user'),
        ])),
        
        # New notifications routes
        path('notifications/', include([
            path('', get_notifications, name='get_notifications'),
            path('unread-count/', get_unread_count, name='get_unread_count'),
            path('<uuid:notification_id>/read/', mark_notification_read, name='mark_notification_read'),
            path('mark-all-read/', mark_all_read, name='mark_all_read'),
            path('<uuid:notification_id>/clear/', clear_notification, name='clear_notification'),
            path('clear-all/', clear_all_notifications, name='clear_all_notifications'),
        ])),
        
        # Internal routes
        path('internal/', include([
            path('update-status/', update_online_status, name='update_online_status'),
        ])),
    ])),
]