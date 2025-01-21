from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'username', 'display_name', 'avatar_url', 'is_2fa_enabled')
        read_only_fields = ('id', 'is_2fa_enabled')