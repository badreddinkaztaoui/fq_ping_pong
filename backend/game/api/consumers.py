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
import math

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
                "players": {
                    "player_1": {"channel": opponent_channel, "user_id": opponent_user_id},
                    "player_2": {"channel": self.channel_name, "user_id": user_id}
                },
                "ball": {"x": 50, "y": 50, "dx": random.choice(BALL_DIRECTION_OPTIONS)[0], "dy": random.choice(BALL_DIRECTION_OPTIONS)[1]},
                "paddles": {"p1_y": 50, "p2_y": 50},
                "score": {"p1": 0, "p2": 0},
                "speed": BALL_SPEED
            }
            
            await self.channel_layer.group_add(room_name, self.channel_name)
            await self.channel_layer.group_add(room_name, opponent_channel)
            
            await self.channel_layer.send(opponent_channel, {
                "type": "match_found",
                "room": room_name,
                "role": "player_1"
            })
            await self.channel_layer.send(self.channel_name, {
                "type": "match_found",
                "room": room_name,
                "role": "player_2"
            })
            
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
        room_name = next((r for r, g in games.items() if any(p["channel"] == self.channel_name for p in g["players"].values())), None)
        
        if not room_name:
            return
        
        if data["type"] == "move":
            game = games[room_name]
            player_role = next((role for role, info in game["players"].items() if info["channel"] == self.channel_name), None)
            if player_role:
                paddle_key = "p1_y" if player_role == "player_1" else "p2_y"
                games[room_name]["paddles"][paddle_key] = max(0, min(100, data["y_position"]))

    
    async def game_loop(self, room_name):
        """Main game loop running at 60 FPS"""
        while room_name in games:
            game = games[room_name]
            game["ball"]["x"] += game["ball"]["dx"] * game["speed"]
            game["ball"]["y"] += game["ball"]["dy"] * game["speed"]
            
            if game["ball"]["y"] <= 0:
                game["ball"]["y"] = 0
                game["ball"]["dy"] = abs(game["ball"]["dy"])
            elif game["ball"]["y"] >= 100:
                game["ball"]["y"] = 100
                game["ball"]["dy"] = -abs(game["ball"]["dy"])
            
            PADDLE_HEIGHT = 20
            PADDLE_WIDTH = 5
            
            def calculate_bounce_angle(hit_position, paddle_height):
                relative_intersect = (hit_position - paddle_height / 2) / (paddle_height / 2)
                max_bounce_angle = 75 * math.pi / 180
                bounce_angle = relative_intersect * max_bounce_angle
                return math.sin(bounce_angle), math.cos(bounce_angle)
            
            if (game["ball"]["x"] <= PADDLE_WIDTH and 
                game["ball"]["x"] >= 0 and
                abs(game["paddles"]["p1_y"] - game["ball"]["y"]) < PADDLE_HEIGHT/2):
                
                hit_position = game["ball"]["y"] - (game["paddles"]["p1_y"] - PADDLE_HEIGHT/2)
                dy, dx = calculate_bounce_angle(hit_position, PADDLE_HEIGHT)
                
                game["ball"]["dx"] = abs(dx)
                game["ball"]["dy"] = dy
                game["ball"]["x"] = PADDLE_WIDTH
                game["speed"] = min(game["speed"] * 1.1, 1.0)
                
            elif (game["ball"]["x"] >= (100 - PADDLE_WIDTH) and 
                game["ball"]["x"] <= 100 and
                abs(game["paddles"]["p2_y"] - game["ball"]["y"]) < PADDLE_HEIGHT/2):
                
                hit_position = game["ball"]["y"] - (game["paddles"]["p2_y"] - PADDLE_HEIGHT/2)
                dy, dx = calculate_bounce_angle(hit_position, PADDLE_HEIGHT)
                
                game["ball"]["dx"] = -abs(dx)
                game["ball"]["dy"] = dy
                game["ball"]["x"] = 100 - PADDLE_WIDTH
                game["speed"] = min(game["speed"] * 1.1, 1.0)
            
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
                winner_role = "player_1" if game["score"]["p1"] >= WINNING_SCORE else "player_2"
                winner_id = game["players"][winner_role]["user_id"]
                
                await self.channel_layer.group_send(room_name, {
                    "type": "game_end",
                    "message": "Game Over",
                    "game": game,
                    "winner": winner_role,
                    "winner_id": winner_id,
                    "final_score": game["score"]
                })
                games.pop(room_name, None)
                break
            
            await self.channel_layer.group_send(room_name, {
                "type": "game_state_update",
                "data": game
            })
            await asyncio.sleep(INTERVAL)

    async def match_found(self, event):
        """Handle match found event with specific role assignment"""
        await self.send(text_data=json.dumps({
            "type": "match_found",
            "room": event["room"],
            "role": event["role"]
        }))


    async def game_state_update(self, event):
        await self.send(text_data=json.dumps({"type": "game_state_update", "data": event["data"]}))

    async def score_update(self, event):
        await self.send(text_data=json.dumps({"type": "score_update", "score": event["score"]}))

    async def game_end(self, event):    
        await self.save_game_history(event["game"])
        
        await self.send(text_data=json.dumps({
            "type": "game_end",
            "message": event["message"],
            "winner": event["winner"],
            "final_score": event["final_score"]
        }))


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
        try:
            game_instance = GameHistory.objects.get(id=uuid.UUID(game["id"]))
            game_instance.player_1_score = game["score"]["p1"]
            game_instance.player_2_score = game["score"]["p2"]   
            winner_id = (game["players"]["player_1"]["user_id"] 
                        if game["score"]["p1"] > game["score"]["p2"] 
                        else game["players"]["player_2"]["user_id"])
            
            game_instance.winner_id = uuid.UUID(winner_id)
            game_instance.save()
            
        except Exception as e:
            logger.error(f"Failed to save game history: {e}")


