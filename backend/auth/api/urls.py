from django.urls import path, include
from .views import health_check

urlpatterns = [
    path('auth/', include([
        path('health/', health_check, name='health_check'),
    ])),
]