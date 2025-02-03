from django.urls import path, include
from .views import (
    ChatHealthCheck,
    StartChatView,
    ChatMessagesView,
    SendMessageView,
)

urlpatterns = [
    path('chat/', include([
        path('health/', ChatHealthCheck.as_view(), name='chat_health_check'),
        path('start/', StartChatView.as_view(), name='start_chat'),
        path('<str:chat_id>/messages/', ChatMessagesView.as_view(), name='chat_messages'),
        path('<str:chat_id>/send/', SendMessageView.as_view(), name='send_message'),
    ])),
]