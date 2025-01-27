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
    reset_password_confirm,
    enable_2fa,
    verify_2fa,
    reset_password_request,
    disable_2fa,
    verify_2fa_login
)

urlpatterns = [
    path('auth/', include([
        path('health/', health_check, name='health_check'),
        path('register/', register_view, name='register'),
        path('login/', login_view, name='login'),
        path('logout/', logout_view, name='logout'),
        path('me/', me_view, name='me'),
        path('verify/', verify_token, name='verify_token'),
        path('42/login/', oauth_42_login, name='oauth_42_login'),
        path('42/callback/', oauth_42_callback, name='oauth_42_callback'),
        path('update/', update_user, name='update_user'),
        path('reset-password/', reset_password_request, name='reset_password_request'),
        path('reset-password/<str:uidb64>/<str:token>/', reset_password_confirm, name='reset_password_confirm'),
        path('enable-2fa/', enable_2fa, name='enable_2fa'),
        path('verify-2fa/', verify_2fa, name='verify_2fa'),
        path('disable-2fa/', disable_2fa, name='disable_2fa'),
        path('verify-2fa-login/', verify_2fa_login, name='verify_2fa_login'),
    ])),
]