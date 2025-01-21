import uuid
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models

# First, we need a custom user manager to handle user creation
class CustomUserManager(BaseUserManager):
    def create_user(self, email, username, password=None, **extra_fields):
        """
        Creates and saves a User with the given email, username and password.
        """
        if not email:
            raise ValueError('Users must have an email address')
        if not username:
            raise ValueError('Users must have a username')

        # Normalize email to lowercase
        email = self.normalize_email(email)
        
        user = self.model(
            email=email,
            username=username,
            **extra_fields
        )
        
        user.set_password(password)  # This handles password hashing
        user.save(using=self._db)
        return user

    def create_superuser(self, email, username, password=None, **extra_fields):
        """
        Creates and saves a superuser with the given email, username and password.
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        return self.create_user(email, username, password, **extra_fields)

# Now, let's create our custom User model
class User(AbstractUser):
    """
    Custom user model that uses email as the unique identifier alongside username
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=150, unique=True)
    display_name = models.CharField(max_length=150)
    avatar_url = models.URLField(null=True, blank=True)
    is_2fa_enabled = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    # Remove the password_hash field as AbstractUser already provides password field
    # Remove last_login as it's already included in AbstractUser

    # Specify the required fields for creating a user
    REQUIRED_FIELDS = ['email']  # username is automatically required

    # Use our custom manager
    objects = CustomUserManager()

    def __str__(self):
        return self.email

    class Meta:
        ordering = ['-created_at']