from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import health_check


urlpatterns = [
    path('game/', include([
        path('health/', health_check, name='health_check'),
    ])),
]