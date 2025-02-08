import json, aiohttp
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.conf import settings
from typing import Optional
from .models import Messages
from .models import BlockUsers
import logging

logger = logging.getLogger(__name__)

class ChatConsumer(AsyncWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)        
        self.user_id = None
        self.room_name = None


    async def connect(self):
        try:
            user_id = self.scope.get('user_id')
            logger.info(f"The user id is {user_id}")
            if not user_id:
                logger.error("user_id not found")
                await self.close(code=401)
                return

            self.user_id = str(user_id)
            self.room_name = f"user_{self.user_id}"

            await self.channel_layer.group_add(self.room_name, self.channel_name)
            await self.mark_user_online()
            await self.accept()
        except Exception as e:
            logger.info(f"Error in consumers ---> {str(e)}")
            return await self.close(401, f"Authentication failed: {str(e)}")

    async def disconnect(self):
        await self.channel_layer.group_discard(self.room_name, self.channel_name)
        await self.mark_user_offline()


    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        content = text_data_json['content']
        receiver_id = text_data_json['receiver_id']

        try:
            if not (content and receiver_id):
                await self.send_error("Message could not be sent. content and receiver_id are required.")
                return

            block_status = await self.check_blocked_users(receiver_id)
            if block_status:
                await self.send_error("Message could not be sent. You are blocked by this user or you have blocked them.")
                return

            await self.save_message(content, receiver_id)

            await self.channel_layer.group_send(
                f"user_{receiver_id}",
                {
                    "type": "send.message",
                    "sender": self.user_id,
                    "content": content,
                },
            )
        except Exception as e:
            await self.send_error(str(e))


    async def mark_user_online(self):
        """
        Marks user as online both in Redis and Auth service
        """
        try:            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{settings.AUTH_SERVICE_URL}/api/auth/internal/update-status/",
                    json={
                        'user_id': self.user_id,
                        'is_online': True
                    }
                ) as response:
                    if response.status != 200:
                        print(f"Failed to update online status in auth service: {await response.text()}")       
        except Exception as e:
            print(f"Error marking user online: {e}")

    async def mark_user_offline(self):
        """
        Marks user as offline both in Redis and Auth service
        """
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{settings.AUTH_SERVICE_URL}/api/auth/internal/update-status/",
                    json={
                        'user_id': self.user_id,
                        'is_online': False
                    }
                ) as response:
                    if response.status != 200:
                        print(f"Failed to update offline status in auth service: {await response.text()}")      
        except Exception as e:
            print(f"Error marking user offline: {e}")


    async def send_message(self, event):
        await self.send(json.dumps({
            "type": "message",
            "sender": event["sender"],
            "content": event["content"],
        }))
    
    async def send_error(self, message: str):
        """
        Sends error message to the client.
        """
        await self.send(json.dumps({
            'type': 'error',
            'message': message
        }))


    @database_sync_to_async
    def save_message(self, content, receiver):
        sender = self.user_id
        Messages.objects.create(sender=sender, receiver=receiver, content=content)

    @database_sync_to_async
    def check_blocked_users(self, receiver):
        sender = self.user_id

        sender_blocked_receiver = BlockUsers.objects.filter(blocker=sender, blocked=receiver).exists()
        receiver_blocked_sender = BlockUsers.objects.filter(blocker=receiver, blocked=sender).exists()

        return sender_blocked_receiver or receiver_blocked_sender
