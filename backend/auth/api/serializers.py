from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Friendship, UserBlock, Notification

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    auth_provider = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = (
            'id', 
            'email', 
            'username', 
            'display_name', 
            'avatar_url', 
            'is_2fa_enabled', 
            'created_at',
            'auth_provider',
            'is_online',
            'last_active',
            'coins'
        )
        read_only_fields = (
            'id', 
            'is_2fa_enabled', 
            'created_at',
            'auth_provider'
        )

class UserFriendSerializer(serializers.ModelSerializer):
    """Simplified user serializer for friend lists"""
    class Meta:
        model = User
        fields = ('id', 'username', 'display_name', 'avatar_url', 'is_online', 'last_active')

class FriendshipSerializer(serializers.ModelSerializer):
    user = UserFriendSerializer(read_only=True)
    friend = UserFriendSerializer(read_only=True)

    class Meta:
        model = Friendship
        fields = ('id', 'user', 'friend', 'created_at', 'is_accepted')
        read_only_fields = ('id', 'created_at')

class UserBlockSerializer(serializers.ModelSerializer):
    blocked_user = UserFriendSerializer(read_only=True)

    class Meta:
        model = UserBlock
        fields = ('id', 'blocked_user', 'created_at')
        read_only_fields = ('id', 'created_at')

class NotificationSerializer(serializers.ModelSerializer):
    related_user = serializers.SerializerMethodField()
    friendship_id = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = (
            'id',
            'notification_type',
            'title',
            'message',
            'is_read',
            'created_at',
            'action_url',
            'related_user',
            'friendship_id'
        )
        read_only_fields = (
            'id',
            'notification_type',
            'title',
            'message',
            'created_at',
            'action_url',
            'related_user',
            'friendship_id'
        )

    def get_related_user(self, obj):
        """
        Extract user information based on notification type and related object.
        For friend requests, this will be the requesting user.
        For friend accepts, this will be the accepting user.
        """
        try:
            if obj.notification_type in ['friend_request', 'friend_accept', 'friend_reject']:
                friendship = obj.related_object
                
                if not friendship:
                    return None
                    
                if obj.notification_type == 'friend_request':
                    user = friendship.user
                else:
                    user = friendship.friend
                
                return {
                    'id': str(user.id),
                    'username': user.username,
                    'avatar_url': user.avatar_url or None,
                    'display_name': user.display_name
                }
        except Exception as e:
            print(f"Error getting related user: {e}")
            return None
        
        return None

    def get_friendship_id(self, obj):
        """
        Get the friendship ID if the notification is related to a friendship.
        This is crucial for friend request actions like accept/reject.
        """
        try:
            if obj.notification_type in ['friend_request', 'friend_accept', 'friend_reject']:
                friendship = obj.related_object
                if friendship:
                    return str(friendship.id)
        except Exception as e:
            print(f"Error getting friendship ID: {e}")
        
        return None