from django.urls import path, include
from .views import (
    health_check,
    register_view,
    login_view,
    logout_view,
    me_view,
    oauth_42_login,
    oauth_42_callback,
    verify_token
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
    ])),
]