from .models import Messages
from rest_framework import serializers

class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Messages
        fields = ['sender', 'receiver', 'content', 'time']
