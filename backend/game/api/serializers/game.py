# api/serializers/game.py

from rest_framework import serializers
from api.models import Game, GameState, PlayerStats, Achievement, User

class UserMinimalSerializer(serializers.ModelSerializer):
    """A minimal serializer for User model to be used in nested relationships"""
    class Meta:
        model = User
        fields = ('id', 'username', 'display_name', 'avatar_url')

class GameStateSerializer(serializers.ModelSerializer):
    """Serializer for the real-time game state"""
    class Meta:
        model = GameState
        fields = (
            'ball_x', 
            'ball_y',
            'ball_velocity_x',
            'ball_velocity_y',
            'paddle1_y',
            'paddle2_y',
            'last_updated'
        )

class GameSerializer(serializers.ModelSerializer):
    """
    Game serializer with detailed player information and current state
    """
    player1 = UserMinimalSerializer(read_only=True)
    player2 = UserMinimalSerializer(read_only=True)
    winner = UserMinimalSerializer(read_only=True)
    current_state = GameStateSerializer(read_only=True)
    duration = serializers.SerializerMethodField()

    class Meta:
        model = Game
        fields = (
            'id',
            'player1',
            'player2',
            'winner',
            'status',
            'game_type',
            'score_player1',
            'score_player2',
            'start_time',
            'end_time',
            'current_state',
            'duration'
        )

    def get_duration(self, obj):
        """Calculate the game duration in seconds"""
        if obj.end_time and obj.start_time:
            return (obj.end_time - obj.start_time).total_seconds()
        return None

class PlayerStatsSerializer(serializers.ModelSerializer):
    """
    Enhanced player statistics serializer with calculated fields
    """
    user = UserMinimalSerializer(read_only=True)
    win_rate = serializers.SerializerMethodField()
    
    class Meta:
        model = PlayerStats
        fields = (
            'user',
            'games_played',
            'wins',
            'losses',
            'elo_rating',
            'tournament_wins',
            'ai_games_won',
            'current_streak',
            'best_streak',
            'win_rate'
        )

    def get_win_rate(self, obj):
        """Calculate win rate as a percentage"""
        if obj.games_played > 0:
            return round((obj.wins / obj.games_played) * 100, 2)
        return 0.0

class AchievementSerializer(serializers.ModelSerializer):
    """
    Achievement serializer with user count
    """
    user_count = serializers.SerializerMethodField()

    class Meta:
        model = Achievement
        fields = ('id', 'name', 'description', 'users', 'user_count')

    def get_user_count(self, obj):
        """Get the number of users who have earned this achievement"""
        return obj.users.count()