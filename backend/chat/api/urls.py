from django.urls import path, include
from .views import (
    ChatHealthCheck,
    ListMessagesView,
    ListLatestConversasions,
    BlockUsersView
)

urlpatterns = [
    path('chat/', include([
        path('health/', ChatHealthCheck.as_view(), name='chat_health_check'),
        path('<uuid:sender>/messages/', ListMessagesView.as_view()),
        path('list/', ListLatestConversasions.as_view()),
        path('block/', BlockUsersView.as_view())
    ])),
]