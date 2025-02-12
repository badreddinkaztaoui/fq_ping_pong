import math
import json
import asyncio
import logging
import random
import uuid
from collections import deque
from .models import GameHistory
from asgiref.sync import sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer

logger = logging.getLogger(__name__)

waiting_players = deque()
games = {}

BALL_SPEED = 0.75
MAX_BALL_SPEED = 2

BALL_DIRECTION_OPTIONS = [
    (round(math.cos(angle), 2), round(math.sin(angle), 2))
    for angle in [math.radians(deg) for deg in range(20, 161, 20)]
] + [
    (round(math.cos(angle), 2), round(math.sin(angle), 2))
    for angle in [math.radians(deg) for deg in range(200, 341, 20)]
]

INTERVAL = 1 / 60
WINNING_SCORE = 5
PADDLE_HEIGHT = 20


class PongGameConsumer(AsyncWebsocketConsumer):
    async def connect(self):
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
                "ball": {
                    "x": 49, 
                    "y": 49, 
                    "dx": random.choice(BALL_DIRECTION_OPTIONS)[0], 
                    "dy": random.choice(BALL_DIRECTION_OPTIONS)[1]
                },
                "paddles": {"p1_y": 50, "p2_y": 50},
                "score": {"p1": 0, "p2": 0},
                "speed": BALL_SPEED
            }
            await self.channel_layer.group_add(room_name, opponent_channel)
            await self.channel_layer.group_add(room_name, self.channel_name)
            await self.channel_layer.group_send(
                room_name, {
                    "type": "match_found",
                    "room": room_name,
                    "players": [opponent_user_id, user_id]
                }
            )
            asyncio.create_task(self.game_loop(room_name))
        else:
            waiting_players.append((self.channel_name, user_id))

    async def disconnect(self, close_code):
        room_name = next(
            (r for r, g in games.items() if self.channel_name in [p[0] for p in g["players"]]),
            None
        )
        if room_name:
            game = games[room_name]
            # Force an immediate win for the other player
            if self.channel_name == game["players"][0][0]:
                game["score"]["p2"] = WINNING_SCORE
            else:
                game["score"]["p1"] = WINNING_SCORE

            await self.channel_layer.group_send(
                room_name, {"type": "score_update", "score": game["score"]}
            )
    
            await self.channel_layer.group_send(
                room_name,
                {"type": "game_end", "message": "Opponent disconnected, YOU WIN", "game": game}
            )
            games.pop(room_name, None)
            await self.channel_layer.group_discard(room_name, self.channel_name)

        # Remove from waiting list if present
        if any(self.channel_name == p[0] for p in waiting_players):
            waiting_players.remove(
                next(player for player in waiting_players if player[0] == self.channel_name)
            )

    async def receive(self, text_data):
        data = json.loads(text_data)
        room_name = next(
            (r for r, g in games.items() if self.channel_name in [p[0] for p in g["players"]]),
            None
        )
        if not room_name:
            return

        if data["type"] == "move":
            player_index = [p[0] for p in games[room_name]["players"]].index(self.channel_name)
            # Clamp paddle between 0 and 100
            games[room_name]["paddles"][f"p{player_index+1}_y"] = max(
                0, min(100, data["y_position"])
            )

    async def game_loop(self, room_name):
        while room_name in games:
            game = games[room_name]
            ball = game["ball"]

            # Move ball
            ball["x"] += ball["dx"] * game["speed"]
            ball["y"] += ball["dy"] * game["speed"]

            # Top/Bottom walls
            if ball["y"] <= 2 or ball["y"] >= 98:
                ball["dy"] *= -1

            # Left side (player 1)
            if ball["x"] <= 2:
                # If hits paddle, bounce; else score
                if abs(game["paddles"]["p1_y"] - ball["y"]) <= PADDLE_HEIGHT / 2:
                    game["speed"] = min (game["speed"] * 1.15, MAX_BALL_SPEED)
                    ball["x"] = 2
                    ball["dx"] *= -1
                else:
                    game["speed"] = BALL_SPEED
                    game["score"]["p2"] += 1
                    game["paddles"]["p2_y"] = 50
                    game["paddles"]["p1_y"] = 50
                    ball.update({
                        "x": 49, "y": 49,
                        "dx": random.choice(BALL_DIRECTION_OPTIONS)[0],
                        "dy": random.choice(BALL_DIRECTION_OPTIONS)[1]
                    })
                    await self.channel_layer.group_send(
                        room_name, {"type": "score_update", "score": game["score"]}
                    )

            # Right side (player 2)
            elif ball["x"] >= 98:
                if abs(game["paddles"]["p2_y"] - ball["y"]) <= PADDLE_HEIGHT / 2:
                    game["speed"] = min (game["speed"] * 1.15, MAX_BALL_SPEED)
                    ball["x"] = 98
                    ball["dx"] *= -1
                else:
                    game["speed"] = BALL_SPEED
                    game["score"]["p1"] += 1
                    game["paddles"]["p2_y"] = 50
                    game["paddles"]["p1_y"] = 50
                    ball.update({
                        "x": 49, "y": 49,
                        "dx": random.choice(BALL_DIRECTION_OPTIONS)[0],
                        "dy": random.choice(BALL_DIRECTION_OPTIONS)[1]
                    })
                    await self.channel_layer.group_send(
                        room_name, {"type": "score_update", "score": game["score"]}
                    )

            # Check for game over
            if game["score"]["p1"] >= WINNING_SCORE or game["score"]["p2"] >= WINNING_SCORE:
                winner_name = game["players"][0][1] if game["score"]["p1"] > game["score"]["p2"] else game["players"][1][1]
                await self.channel_layer.group_send(
                    room_name,
                    {"type": "game_end", "message": f"Game over, {winner_name}", "game": game}
                )
                games.pop(room_name, None)
                break

            # Broadcast state
            await self.channel_layer.group_send(
                room_name,
                {"type": "game_state_update", "data": game}
            )
            await asyncio.sleep(INTERVAL)

    async def match_found(self, event):
        player_1_id, player_2_id = event["players"]
        logger.info(f"Match found for channel {self.channel_name}")
        logger.info(f"Players: {player_1_id} vs {player_2_id}")
        # Assign role by matching current scope user with player_1 or player_2
        role = "player_1" if self.scope.get("user_id") == player_1_id else "player_2"
        await self.send(text_data=json.dumps({
            "type": "match_found",
            "room": event["room"],
            "role": role
        }))

    async def game_state_update(self, event):
        await self.send(text_data=json.dumps({
            "type": "game_state_update",
            "data": event["data"]
        }))

    async def score_update(self, event):
        await self.send(text_data=json.dumps({
            "type": "score_update",
            "score": event["score"]
        }))

    async def game_end(self, event):
        await self.save_game_history(event["game"])
        await self.send(text_data=json.dumps({
            "type": "game_end",
            "message": event["message"]
        }))

    @sync_to_async
    def create_game_instance(self, player_1_id, player_2_id):
        return GameHistory.objects.create(
            player_1_id=uuid.UUID(player_1_id),
            player_2_id=uuid.UUID(player_2_id),
            player_1_score=0,
            player_2_score=0,
            winner_id=None
        )

    @sync_to_async
    def save_game_history(self, game):
        logger.info(f"Saving game history: {game}")
        game_instance = GameHistory.objects.get(id=uuid.UUID(game["id"]))
        game_instance.player_1_id = uuid.UUID(game["players"][0][1])
        game_instance.player_2_id = uuid.UUID(game["players"][1][1])
        game_instance.player_1_score = game["score"]["p1"]
        game_instance.player_2_score = game["score"]["p2"]
        game_instance.winner_id = (
            uuid.UUID(game["players"][0][1])
            if game["score"]["p1"] > game["score"]["p2"]
            else uuid.UUID(game["players"][1][1])
        )
        game_instance.save()
