from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Friendship

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'username', 'display_name', 'avatar_url', 'is_2fa_enabled', 'created_at')
        read_only_fields = ('id', 'is_2fa_enabled', 'created_at')

class FriendshipSerializer(serializers.ModelSerializer):
    friend = UserSerializer(read_only=True)

    class Meta:
        model = Friendship
        fields = ('id', 'friend', 'created_at', 'is_accepted')
        read_only_fields = ('id', 'created_at')

class FriendRequestSerializer(serializers.Serializer):
    friend_id = serializers.UUIDField()

class FriendResponseSerializer(serializers.Serializer):
    friendship_id = serializers.UUIDField()
    accept = serializers.BooleanField()