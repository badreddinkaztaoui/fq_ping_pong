from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import health_check, GameViewSet, PlayerStatsViewSet

router = DefaultRouter()
router.register(r'games', GameViewSet)
router.register(r'stats', PlayerStatsViewSet)

urlpatterns = [
    path('game/', include([
        path('health/', health_check, name='health_check'),
        path('', include(router.urls)),
    ])),
]