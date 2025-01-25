from rest_framework import serializers
from .models import ChatRoom, Message, ChatUserPreference

class ChatRoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatRoom
        fields = ('id', 'name', 'created_at', 'participants')

class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ('id', 'room', 'sender', 'content', 'timestamp')

class ChatUserPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatUserPreference
        fields = ('user', 'notification_enabled', 'theme')