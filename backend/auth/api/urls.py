from django.urls import path, include
from .views import SignUpView, LoginView, oauth_42_login, oauth_42_callback, health_check

urlpatterns = [
    path('auth/', include([
        path('health/', health_check, name='health_check'),
        path('signup/', SignUpView.as_view(), name='signup'),
        path('login/', LoginView.as_view(), name='login'),
        path('login/42/', oauth_42_login, name='oauth_42_login'),
    ])),
    path('oauth/callback', oauth_42_callback, name='oauth_42_callback'),
]