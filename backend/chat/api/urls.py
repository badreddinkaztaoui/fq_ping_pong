from django.urls import path, include
from .views import (
    ChatHealthCheck,
)

urlpatterns = [
    path('chat/', include([
        path('health/', ChatHealthCheck.as_view(), name='chat_health_check'),
    ])),
]