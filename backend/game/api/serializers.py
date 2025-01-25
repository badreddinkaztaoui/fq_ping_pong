from rest_framework import serializers
from .models import Game, PlayerStats, Achievement

class GameSerializer(serializers.ModelSerializer):
    class Meta:
        model = Game
        fields = ('id', 'player1', 'player2', 'winner', 'start_time', 'end_time')

class PlayerStatsSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlayerStats
        fields = ('user', 'games_played', 'wins', 'losses', 'elo_rating')

class AchievementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Achievement
        fields = ('id', 'name', 'description', 'users')