from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Friendship, UserBlock

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
            'last_active'
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