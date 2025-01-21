from django.urls import path, include
from .views import (
    health_check,
    register_view,
    login_view,
    logout_view,
    me_view
)

urlpatterns = [
    path('auth/', include([
        path('health/', health_check, name='health_check'),
        path('register/', register_view, name='register'),
        path('login/', login_view, name='login'),
        path('logout/', logout_view, name='logout'),
        path('me/', me_view, name='me'),
    ])),
]