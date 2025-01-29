from django.db import models
import uuid

class PersonalChat(models.Model):
    """
    Represents a one-on-one conversation between two users.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    user1_id = models.UUIDField()
    user2_id = models.UUIDField()
    
    created_at = models.DateTimeField(auto_now_add=True)
    last_message_at = models.DateTimeField(null=True, blank=True)
    
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('user1_id', 'user2_id')
        verbose_name = 'Personal Chat'
        verbose_name_plural = 'Personal Chats'
        indexes = [
            models.Index(fields=['user1_id', 'user2_id']),
        ]

    def __str__(self):
        return f"Chat between {self.user1_id} and {self.user2_id}"


class PersonalMessage(models.Model):
    """
    Represents a message in a personal chat.
    """
    MESSAGE_STATUS = [
        ('sent', 'Sent'),
        ('delivered', 'Delivered'),
        ('read', 'Read'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    chat = models.ForeignKey(
        PersonalChat, 
        related_name='messages', 
        on_delete=models.CASCADE
    )
    
    sender_id = models.UUIDField()
    
    content = models.TextField()
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    status = models.CharField(
        max_length=20, 
        choices=MESSAGE_STATUS, 
        default='sent'
    )
    
    metadata = models.JSONField(null=True, blank=True)
    
    is_edited = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False)

    class Meta:
        ordering = ['created_at']
        verbose_name = 'Personal Message'
        verbose_name_plural = 'Personal Messages'

    def __str__(self):
        return f"Message in chat {self.chat_id} from {self.sender_id}"