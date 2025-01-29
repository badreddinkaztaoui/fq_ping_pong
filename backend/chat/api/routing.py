from django.urls import re_path
from .consumers import PersonalChatConsumer

websocket_urlpatterns = [
    # WebSocket route for personal chats
    # URL will look like: ws://localhost:8000/ws/chat/{chat_id}/
    re_path(r'ws/chat/(?P<chat_id>[\w-]+)/$', PersonalChatConsumer.as_asgi()),
]