from rest_framework import serializers
from .models import PersonalChat, PersonalMessage
import uuid

class PersonalChatSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(format='hex')
    user1_id = serializers.UUIDField(format='hex')
    user2_id = serializers.UUIDField(format='hex')
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = PersonalChat
        fields = [
            'id', 
            'user1_id', 
            'user2_id', 
            'created_at', 
            'last_message_at', 
            'is_active',
            'last_message',
            'unread_count'
        ]
        read_only_fields = ['id', 'created_at']

    def get_last_message(self, obj):
        last_message = obj.messages.order_by('-created_at').first()
        return PersonalMessageSerializer(last_message).data if last_message else None

    def get_unread_count(self, obj):
        user = self.context.get('request').user
        try:
            user_id = uuid.UUID(str(user['id']))
            return obj.messages.filter(
                status__in=['sent', 'delivered']
            ).exclude(sender_id=user_id).count()
        except (ValueError, TypeError, KeyError):
            return 0

class PersonalMessageSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(format='hex')
    chat = serializers.UUIDField(source='chat_id')
    sender_id = serializers.UUIDField(format='hex')

    class Meta:
        model = PersonalMessage
        fields = [
            'id', 
            'chat', 
            'sender_id', 
            'content', 
            'created_at', 
            'status',
            'metadata',
            'is_edited',
            'is_deleted'
        ]
        read_only_fields = ['id', 'created_at']