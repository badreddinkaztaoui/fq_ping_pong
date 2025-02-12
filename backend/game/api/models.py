import uuid
from django.db import models

class GameHistory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    player_1_id = models.UUIDField()
    player_2_id = models.UUIDField()
    player_1_score = models.IntegerField(default=0)
    player_2_score = models.IntegerField(default=0)
    winner_id = models.UUIDField(null=True, blank=True)
    ended_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Game: {self.player_1_id} vs {self.player_2_id} | Winner: {self.winner_id}"


