import json
import asyncio
import logging
import random
import hashlib
from collections import deque
import uuid
from .models import GameHistory
from asgiref.sync import sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer

logger = logging.getLogger(__name__)

# Matchmaking Queue
waiting_players = deque()

# Active games storage
games = {}

# Constants
BALL_SPEED = 0.3
BALL_DIRECTION_OPTIONS = [(-1, -1), (1, -1), (-1, 1), (1, 1)]
INTERVAL = 1 / 60  # 60 times per second
WINNING_SCORE = 3

class PongGameConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        """Handles new player connections and matchmaking"""
        await self.accept()
        user_id = self.scope.get("user_id")
        
        if not user_id:
            await self.close()
            return
        
        if waiting_players:
            opponent_channel, opponent_user_id = waiting_players.popleft()
            game_instance = await self.create_game_instance(user_id, opponent_user_id)
            room_name = str(game_instance.id)

            games[room_name] = {
                "id": room_name,
                "players": [(opponent_channel, opponent_user_id), (self.channel_name, user_id)],
                "ball": {"x": 50, "y": 50, "dx": random.choice(BALL_DIRECTION_OPTIONS)[0], "dy": random.choice(BALL_DIRECTION_OPTIONS)[1]},
                "paddles": {"p1_y": 50, "p2_y": 50},
                "score": {"p1": 0, "p2": 0},
                "speed": BALL_SPEED
            }
            await self.channel_layer.group_add(room_name, self.channel_name)
            await self.channel_layer.group_add(room_name, opponent_channel)
            await self.channel_layer.group_send(room_name, {"type": "match_found", "room": room_name, "players": [opponent_user_id, user_id]})
            asyncio.create_task(self.game_loop(room_name))
        else:
            waiting_players.append((self.channel_name, user_id))

    async def disconnect(self, close_code):
        """Handles player disconnection safely."""
        room_name = next((r for r, g in games.items() if self.channel_name in [p[0] for p in g["players"]]), None)

        if room_name:
            game = games[room_name]
            game["score"] = {"p1": 0, "p2": 0}
            if self.channel_name == game["players"][0][0]:
                game["score"]["p2"] = WINNING_SCORE
            else:
                game["score"]["p1"] = WINNING_SCORE

            await self.channel_layer.group_send(room_name, {"type": "game_end", "message": "Opponent disconnected", "game": game})
            games.pop(room_name, None)
            await self.channel_layer.group_discard(room_name, self.channel_name)

        if any(self.channel_name in player for player in waiting_players):
            waiting_players.remove(next(player for player in waiting_players if player[0] == self.channel_name))

    async def receive(self, text_data):
        """Handles player movements"""
        data = json.loads(text_data)
        room_name = next((r for r, g in games.items() if self.channel_name in [p[0] for p in g["players"]]), None)
        if not room_name:
            return
        
        if data["type"] == "move":
            player_index = [p[0] for p in games[room_name]["players"]].index(self.channel_name)
            games[room_name]["paddles"][f"p{player_index+1}_y"] = max(0, min(100, data["y_position"]))

    
    async def game_loop(self, room_name):
        """Main game loop running at 60 FPS"""
        while room_name in games:
            game = games[room_name]
            game["ball"]["x"] += game["ball"]["dx"] * game["speed"]
            game["ball"]["y"] += game["ball"]["dy"] * game["speed"]
            
            # Wall Collision
            if game["ball"]["y"] <= 0 or game["ball"]["y"] >= 100:
                game["ball"]["dy"] *= -1
            
            # Paddle Collision
            if game["ball"]["x"] <= 5 and abs(game["paddles"]["p1_y"] - game["ball"]["y"]) < 10:
                game["ball"]["dx"] *= -1
            elif game["ball"]["x"] >= 95 and abs(game["paddles"]["p2_y"] - game["ball"]["y"]) < 10:
                game["ball"]["dx"] *= -1
            
            # Scoring
            if game["ball"]["x"] <= 0:
                game["score"]["p2"] += 1
                game["ball"] = {"x": 50, "y": 50, "dx": random.choice(BALL_DIRECTION_OPTIONS)[0], "dy": random.choice(BALL_DIRECTION_OPTIONS)[1]}
                await self.channel_layer.group_send(room_name, {"type": "score_update", "score": game["score"]})
            elif game["ball"]["x"] >= 100:
                game["score"]["p1"] += 1
                game["ball"] = {"x": 50, "y": 50, "dx": random.choice(BALL_DIRECTION_OPTIONS)[0], "dy": random.choice(BALL_DIRECTION_OPTIONS)[1]}
                await self.channel_layer.group_send(room_name, {"type": "score_update", "score": game["score"]})
            
            # Check for Game End
            if game["score"]["p1"] >= WINNING_SCORE or game["score"]["p2"] >= WINNING_SCORE:
                await self.channel_layer.group_send(room_name, {"type": "game_end", "message": "Game Over", "game": game})
                games.pop(room_name, None)
                break
            
            await self.channel_layer.group_send(room_name, {"type": "game_state_update", "data": game})
            await asyncio.sleep(INTERVAL)

    async def match_found(self, event):
        player_1, player_2 = event["players"]
        role = "player_1" if self.channel_name == player_1[0] else "player_2"
        await self.send(text_data=json.dumps({
            "type": "match_found",
            "room": event["room"],
            "role": role
        }))


    async def game_state_update(self, event):
        await self.send(text_data=json.dumps({"type": "game_state_update", "data": event["data"]}))

    async def score_update(self, event):
        await self.send(text_data=json.dumps({"type": "score_update", "score": event["score"]}))

    async def game_end(self, event):    
        await self.save_game_history(event["game"])
        await self.send(text_data=json.dumps({"type": "game_end", "message": event["message"]}))


    @sync_to_async
    def create_game_instance(self, player_1_id, player_2_id):
        """Create a game instance in the database and return it."""
        return GameHistory.objects.create(
            player_1_id=uuid.UUID(player_1_id),
            player_2_id=uuid.UUID(player_2_id),
            player_1_score=0,
            player_2_score=0,
            winner_id=None
        )
    

    @sync_to_async
    def save_game_history(self, game):
        """Save completed game to database in a synchronous context."""

        game_instance = GameHistory.objects.get(id=uuid.UUID(game["id"]))
        game_instance.player_1_id = uuid.UUID(game["players"][0][1])
        game_instance.player_2_id = uuid.UUID(game["players"][1][1])
        game_instance.player_1_score = game["score"]["p1"]
        game_instance.player_2_score = game["score"]["p2"]
        game_instance.winner_id = uuid.UUID(game["players"][0][1]) if game["score"]["p1"] > game["score"]["p2"] else uuid.UUID(game["players"][1][1])
        game_instance.save()


