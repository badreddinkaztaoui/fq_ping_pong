from django.db import models
from django.contrib.auth.models import AbstractUser
import uuid

class User(AbstractUser):
    """
    Proxy model for the User model from the auth service.
    This allows us to reference the User model without duplicating the data.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=150, unique=True)
    display_name = models.CharField(max_length=150)
    avatar_url = models.TextField(blank=True, null=True)
    
    class Meta:
        managed = False
        db_table = 'api_user'

    def __str__(self):
        return self.username