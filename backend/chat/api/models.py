from django.db import models

class Messages(models.Model):
    sender = models.UUIDField()
    receiver = models.UUIDField()
    content = models.TextField()
    time = models.DateTimeField(auto_now_add=True)


class BlockUsers(models.Model):
    blocker = models.UUIDField()
    blocked = models.UUIDField()
    blocked_at = models.DateTimeField(auto_now_add=True)
