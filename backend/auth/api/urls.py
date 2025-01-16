from django.urls import path, include
from .views import (
    SignUpView, 
    LoginView, 
    oauth_42_login,
    oauth_42_callback,
    health_check
)

urlpatterns = [
    path('auth/', include([
        path('signup/', SignUpView.as_view(), name='signup'),
        path('login/', LoginView.as_view(), name='login'),
        path('42/login/', oauth_42_login, name='42_login'),
        path('42/callback/', oauth_42_callback, name='42_callback'),
        path('health/', health_check, name='health_check'),
    ])),
]