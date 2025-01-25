import uuid
from django.db import models
from django.conf import settings

class Game(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    player1 = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='games_as_player1', on_delete=models.CASCADE)
    player2 = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='games_as_player2', on_delete=models.CASCADE)
    winner = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='games_won', null=True, on_delete=models.SET_NULL)
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True)

    def __str__(self):
        return f"Game {self.id}: {self.player1.username} vs {self.player2.username}"

class PlayerStats(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    games_played = models.IntegerField(default=0)
    wins = models.IntegerField(default=0)
    losses = models.IntegerField(default=0)
    elo_rating = models.IntegerField(default=1500)

    def __str__(self):
        return f"{self.user.username}'s stats"

class Achievement(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    description = models.TextField()
    users = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='achievements')

    def __str__(self):
        return self.name