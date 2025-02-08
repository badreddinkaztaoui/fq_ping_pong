import uuid
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models

class CustomUserManager(BaseUserManager):
    def create_user(self, email, username, password=None, **extra_fields):
        if not email or not username:
            raise ValueError('Users must have an email address and username')
        email = self.normalize_email(email)
        user = self.model(email=email, username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, username, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, username, password, **extra_fields)

class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=150, unique=True)
    display_name = models.CharField(max_length=150)
    avatar_url = models.TextField(blank=True, null=True)
    is_2fa_enabled = models.BooleanField(default=False)
    otp_secret = models.CharField(max_length=32, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_42_user = models.BooleanField(default=False)
    is_online = models.BooleanField(default=False)
    last_active = models.DateTimeField(auto_now=True)
    blocked_users = models.ManyToManyField('self', symmetrical=False, related_name='blocked_by_users', blank=True)
    coins = models.IntegerField(default=500)

    REQUIRED_FIELDS = ['email']
    objects = CustomUserManager()

    def __str__(self):
        return self.email

    @property
    def auth_provider(self):
        """Returns the authentication provider for the user"""
        return '42' if self.is_42_user else 'local'

    class Meta:
        ordering = ['-created_at']

class Friendship(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, related_name='friendships', on_delete=models.CASCADE)
    friend = models.ForeignKey(User, related_name='friend_of', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    is_accepted = models.BooleanField(default=False)

    class Meta:
        unique_together = ('user', 'friend')

    def __str__(self):
        return f"{self.user.username} - {self.friend.username}"

class UserBlock(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, related_name='blocks', on_delete=models.CASCADE)
    blocked_user = models.ForeignKey(User, related_name='blocked_by', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'blocked_user')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} blocked {self.blocked_user.username}"

class Notification(models.Model):
    TYPE_FRIEND_REQUEST = 'friend_request'
    TYPE_FRIEND_ACCEPT = 'friend_accept'
    TYPE_FRIEND_REJECT = 'friend_reject'
    TYPE_USER_MENTION = 'user_mention'
    TYPE_SYSTEM_UPDATE = 'system_update'
    
    NOTIFICATION_TYPES = [
        (TYPE_FRIEND_REQUEST, 'Friend Request'),
        (TYPE_FRIEND_ACCEPT, 'Friend Request Accepted'),
        (TYPE_FRIEND_REJECT, 'Friend Request Rejected'),
        (TYPE_USER_MENTION, 'User Mention'),
        (TYPE_SYSTEM_UPDATE, 'System Update')
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    notification_type = models.CharField(
        max_length=50,
        choices=NOTIFICATION_TYPES
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True)
    object_id = models.UUIDField(null=True)
    related_object = GenericForeignKey('content_type', 'object_id')
    
    action_url = models.CharField(max_length=255, blank=True, null=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', '-created_at']),
            models.Index(fields=['is_read', '-created_at'])
        ]

    def __str__(self):
        return f"{self.notification_type} for {self.recipient.username}"

    def mark_as_read(self):
        self.is_read = True
        self.save()