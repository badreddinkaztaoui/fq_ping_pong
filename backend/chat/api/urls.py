from django.urls import path, include
from .views import (
    health_check,
)

urlpatterns = [
    path('chat/', include([
        path('health/', health_check, name='health_check'),
    ])),
]