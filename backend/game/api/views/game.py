from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import models
from django.db.models import F
from api.models import Game, PlayerStats, Achievement
from api.serializers import (
    GameSerializer,
    PlayerStatsSerializer,
    AchievementSerializer
)

class GameViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing game operations.
    Provides CRUD operations and custom actions for game management.
    """
    queryset = Game.objects.all()
    serializer_class = GameSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter games based on user's involvement"""
        return Game.objects.filter(
            models.Q(player1=self.request.user) | 
            models.Q(player2=self.request.user)
        ).select_related(
            'player1', 
            'player2', 
            'winner', 
            'current_state'
        )

    @action(detail=False, methods=['GET'])
    def active(self, request):
        """Get all active games for the current user"""
        active_games = self.get_queryset().filter(
            status='IN_PROGRESS'
        )
        serializer = self.get_serializer(active_games, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['POST'])
    def create_ai_game(self, request):
        """Create a new game against AI"""
        game = Game.objects.create(
            player1=request.user,
            game_type='AI',
            status='WAITING'
        )
        serializer = self.get_serializer(game)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['POST'])
    def join(self, request, pk=None):
        """Join an existing game as player 2"""
        game = self.get_object()
        if game.status != 'WAITING' or game.player2 is not None:
            return Response(
                {'error': 'Game is not available to join'},
                status=status.HTTP_400_BAD_REQUEST
            )

        game.player2 = request.user
        game.status = 'READY'
        game.save()
        
        serializer = self.get_serializer(game)
        return Response(serializer.data)

    @action(detail=True, methods=['POST'])
    def ready(self, request, pk=None):
        """Mark player as ready to start the game"""
        game = self.get_object()
        if game.status != 'READY':
            return Response(
                {'error': 'Game is not in READY state'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if request.user == game.player1:
            game.player1_ready = True
        elif request.user == game.player2:
            game.player2_ready = True
        else:
            return Response(
                {'error': 'You are not a player in this game'},
                status=status.HTTP_403_FORBIDDEN
            )

        game.save()

        if game.player1_ready and game.player2_ready:
            game.status = 'IN_PROGRESS'
            game.save()

        serializer = self.get_serializer(game)
        return Response(serializer.data)

class PlayerStatsViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for player statistics.
    Provides read-only access to player stats and leaderboard information.
    """
    queryset = PlayerStats.objects.all()
    serializer_class = PlayerStatsSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return PlayerStats.objects.select_related('user')

    @action(detail=False, methods=['GET'])
    def my_stats(self, request):
        """Get statistics for the current user"""
        stats, _ = PlayerStats.objects.get_or_create(user=request.user)
        serializer = self.get_serializer(stats)
        return Response(serializer.data)

    @action(detail=False, methods=['GET'])
    def leaderboard(self, request):
        """Get top players by ELO rating"""
        top_players = self.get_queryset().order_by('-elo_rating')[:10]
        serializer = self.get_serializer(top_players, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['GET'])
    def achievements(self, request):
        """Get achievements for the current user"""
        achievements = Achievement.objects.filter(users=request.user)
        serializer = AchievementSerializer(achievements, many=True)
        return Response(serializer.data)