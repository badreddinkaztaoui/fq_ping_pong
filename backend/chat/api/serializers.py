from rest_framework import serializers
from .models import PersonalChat, PersonalMessage

class PersonalChatSerializer(serializers.ModelSerializer):
    """
    Serializer for PersonalChat model.
    Provides comprehensive details about a personal chat.
    """
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
        """
        Retrieves the most recent message in the chat.
        """
        last_message = obj.messages.order_by('-created_at').first()
        return PersonalMessageSerializer(last_message).data if last_message else None

    def get_unread_count(self, obj):
        """
        Counts unread messages for the current user.
        Requires context to be set with the current user.
        """
        user = self.context.get('request').user
        if not user:
            return 0
        return obj.messages.filter(
            status__in=['sent', 'delivered']
        ).exclude(sender_id=user.id).count()


class PersonalMessageSerializer(serializers.ModelSerializer):
    """
    Serializer for PersonalMessage model.
    Provides detailed message information.
    """
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

    def validate_content(self, value):
        """
        Validate message content length.
        """
        max_length = 1000
        if len(value) > 1000:
            raise serializers.ValidationError(f"Message cannot exceed {max_length} characters.")
        return value