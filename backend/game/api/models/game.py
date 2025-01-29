import uuid
from django.db import models
from django.conf import settings

class Game(models.Model):
    """
    Represents a game session between two players or player vs AI.
    This model combines your existing game model with enhanced features
    for real-time gameplay and different game modes.
    """
    # Core fields from your original model
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    player1 = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='games_as_player1',
        on_delete=models.CASCADE
    )
    player2 = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='games_as_player2',
        on_delete=models.CASCADE,
        null=True  # Making it nullable to support AI games
    )
    winner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='games_won',
        null=True,
        on_delete=models.SET_NULL
    )

    # Enhanced features for game state management
    status = models.CharField(
        max_length=20,
        choices=[
            ('WAITING', 'Waiting for players'),
            ('READY', 'Players ready'),
            ('IN_PROGRESS', 'Game in progress'),
            ('FINISHED', 'Game finished'),
            ('ABANDONED', 'Game abandoned')
        ],
        default='WAITING'
    )
    
    # Game type and configuration
    game_type = models.CharField(
        max_length=20,
        choices=[
            ('CASUAL', 'Casual game'),
            ('RANKED', 'Ranked game'),
            ('AI', 'Player vs AI'),
            ('TOURNAMENT', 'Tournament game')
        ],
        default='CASUAL'
    )
    
    # Score tracking
    score_player1 = models.IntegerField(default=0)
    score_player2 = models.IntegerField(default=0)
    
    # Timestamps (keeping your original fields)
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True)
    
    def __str__(self):
        player2_name = self.player2.username if self.player2 else 'AI'
        return f"Game {self.id}: {self.player1.username} vs {player2_name}"

    class Meta:
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['game_type']),
            models.Index(fields=['start_time'])
        ]

class GameState(models.Model):
    """
    Stores the real-time state of an active game.
    This is a new model to handle the dynamic aspects of the game.
    """
    game = models.OneToOneField(Game, on_delete=models.CASCADE, related_name='current_state')
    
    # Ball state
    ball_x = models.FloatField(default=400)  # Center X
    ball_y = models.FloatField(default=300)  # Center Y
    ball_velocity_x = models.FloatField(default=0)
    ball_velocity_y = models.FloatField(default=0)
    
    # Paddle positions
    paddle1_y = models.FloatField(default=300)  # Center Y
    paddle2_y = models.FloatField(default=300)  # Center Y
    
    last_updated = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['last_updated'])
        ]

class PlayerStats(models.Model):
    """
    Stores player statistics, combining your existing fields
    with additional metrics for a richer player profile.
    """
    # Core fields from your original model
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    games_played = models.IntegerField(default=0)
    wins = models.IntegerField(default=0)
    losses = models.IntegerField(default=0)
    elo_rating = models.IntegerField(default=1500)
    
    # Enhanced statistics
    tournament_wins = models.IntegerField(default=0)
    ai_games_won = models.IntegerField(default=0)
    current_streak = models.IntegerField(default=0)
    best_streak = models.IntegerField(default=0)
    
    def __str__(self):
        return f"{self.user.username}'s stats"

    class Meta:
        indexes = [
            models.Index(fields=['elo_rating']),
            models.Index(fields=['games_played'])
        ]

class Achievement(models.Model):
    """
    Represents player achievements and badges.
    Keeping your original implementation as it's well-structured.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    description = models.TextField()
    users = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='achievements')

    def __str__(self):
        return self.name