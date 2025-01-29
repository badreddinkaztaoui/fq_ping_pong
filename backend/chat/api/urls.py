from django.urls import path, include
from .views import (
    ChatHealthCheck,
    start_chat,
    get_chat_messages,
    send_message,
    get_user_chats
)

urlpatterns = [
    path('chat/', include([
        path('health/', ChatHealthCheck.as_view(), name='chat_health_check'),
        
        # Chat management endpoints
        path('start/', start_chat, name='start_chat'),
        path('list/', get_user_chats, name='get_user_chats'),
        path('<str:chat_id>/', include([
            path('messages/', get_chat_messages, name='get_chat_messages'),
            path('send/', send_message, name='send_message'),
        ])),
    ])),
]