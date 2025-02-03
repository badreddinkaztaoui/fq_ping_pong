import json
import uuid
from datetime import datetime, timedelta
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.conf import settings
from django.db.models import Q
import redis.asyncio as redis
from typing import Optional, Dict, Any

class PersonalChatConsumer(AsyncWebsocketConsumer):
    """
    Enhanced WebSocket consumer for real-time personal chat messaging.
    Includes improved message delivery reliability, connection recovery,
    rate limiting, and message pagination.
    """
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.redis_connection = None
        
        self.chat_id: Optional[str] = None
        self.user_id: Optional[str] = None
        self.last_seen_message_id: Optional[str] = None
        
        self.CHAT_MESSAGES_PREFIX = 'personal_chat:messages:'
        self.ONLINE_USERS_PREFIX = 'personal_chat:online_users:'
        self.LAST_SEEN_PREFIX = 'personal_chat:last_seen:'
        self.RATE_LIMIT_PREFIX = 'personal_chat:rate_limit:'
        
        self.is_connected = False

    async def connect(self):
        """
        Enhanced connection handler with reconnection support and presence tracking.
        Validates user authentication and chat membership before establishing connection.
        """
        try:
            try:
                self.redis_connection = await self.get_redis_connection()
            except redis.RedisError as e:
                await self.close(code=4002)
                return
            
            user_data = self.scope['user']
            self.user_id = str(user_data['id'])
            
            self.chat_id = self.scope['url_route']['kwargs'].get('chat_id')
            
            if not all([self.chat_id, self.user_id]):
                await self.close(code=4001)
                return
            
            is_valid_member = await self.check_chat_membership(self.chat_id, self.user_id)
            if not is_valid_member:
                await self.close(code=4003)
                return
            
            self.chat_group_name = f'chat_{self.chat_id}'
            await self.channel_layer.group_add(
                self.chat_group_name,
                self.channel_name
            )
            
            last_seen = await self.get_last_seen()
            self.last_seen_message_id = last_seen
            
            await self.accept()
            await self.mark_user_online()
            
            
            await self.send(json.dumps({
                'type': 'connection_established',
                'chat_id': self.chat_id
            }))
            
            await self.notify_user_presence('user_joined')
            
            if last_seen:
                await self.send_messages_since(last_seen)
            else:
                await self.send_recent_messages()
            
            self.is_connected = True
            
        except Exception as e:
            await self.handle_connection_error(e)

    async def disconnect(self, close_code):
        """
        Enhanced disconnection handler with more robust cleanup.
        """
        cleanup_successful = False
        try:
            if self.is_connected:
                await self.update_last_seen()
                if hasattr(self, 'chat_group_name'):
                    await self.channel_layer.group_discard(
                        self.chat_group_name,
                        self.channel_name
                    )
                await self.mark_user_offline()
                
                if not close_code or close_code < 4000:
                    await self.notify_user_presence('user_left')
                cleanup_successful = True
            
        except Exception as e:
            print(f"Error during disconnect cleanup: {e}")
        finally:
            if self.redis_connection:
                try:
                    await self.redis_connection.close()
                except Exception as e:
                    print(f"Error closing Redis connection: {e}")
            
            if not cleanup_successful:
                try:
                    await self.channel_layer.group_discard(
                        getattr(self, 'chat_group_name', ''),
                        self.channel_name
                    )
                except Exception:
                    pass

    async def receive(self, text_data):
        """
        Enhanced message handler with rate limiting and delivery confirmation.
        Processes incoming messages and broadcasts them to the chat group.
        """
        try:
            data = json.loads(text_data)
            message_content = data.get('message')
            
            if not message_content or not isinstance(message_content, str):
                await self.send_error("Invalid message format")
                return
            
            if not await self.check_rate_limit():
                await self.send_error("Rate limit exceeded")
                return
            
            message_id = str(uuid.uuid4())
            timestamp = datetime.now().isoformat()
            
            message_payload = {
                'id': message_id,
                'chat_id': self.chat_id,
                'sender_id': self.user_id,
                'content': message_content,
                'timestamp': timestamp,
                'status': 'sent'
            }
            
            await self.store_message(message_payload)
            
            await self.channel_layer.group_send(
                self.chat_group_name,
                {
                    'type': 'chat_message',
                    'message': message_payload
                }
            )
            
            await self.send(json.dumps({
                'type': 'message_ack',
                'message_id': message_id,
                'timestamp': timestamp
            }))
            
        except json.JSONDecodeError:
            await self.send_error("Invalid message format")
        except Exception as e:
            await self.send_error(f"Error processing message: {str(e)}")

    async def chat_message(self, event):
        """
        Handles message broadcasting with delivery status updates.
        """
        message = event['message']
        
        if message['sender_id'] != self.user_id:
            message['status'] = 'delivered'
            await self.update_message_status(message['id'], 'delivered')
        
        await self.send(json.dumps({
            'type': 'chat_message',
            'message': message
        }))

    async def send_recent_messages(self, limit=50):
        """
        Enhanced message history retrieval with pagination support.
        """
        try:
            redis_key = f'{self.CHAT_MESSAGES_PREFIX}{self.chat_id}'
            recent_messages = await self.redis_connection.zrevrange(
                redis_key, 0, limit-1
            )
            
            for msg in reversed(recent_messages):
                message = json.loads(msg)
                await self.send(json.dumps({
                    'type': 'chat_message',
                    'message': message
                }))
                
        except Exception as e:
            await self.send_error(f"Error retrieving messages: {str(e)}")

    async def send_messages_since(self, last_seen_id: str):
        """
        Retrieves and sends messages that were missed during disconnection.
        """
        try:
            redis_key = f'{self.CHAT_MESSAGES_PREFIX}{self.chat_id}'
            last_seen_msg = await self.redis_connection.zscore(redis_key, last_seen_id)
            
            if last_seen_msg:
                missed_messages = await self.redis_connection.zrangebyscore(
                    redis_key,
                    min=last_seen_msg,
                    max='+inf'
                )
                
                for msg in missed_messages:
                    message = json.loads(msg)
                    if message['id'] != last_seen_id:
                        await self.send(json.dumps({
                            'type': 'chat_message',
                            'message': message
                        }))
                        
        except Exception as e:
            await self.send_error(f"Error retrieving missed messages: {str(e)}")

    async def store_message(self, message: Dict[str, Any]):
        """
        Stores message in Redis with improved error handling and TTL management.
        """
        try:
            redis_key = f'{self.CHAT_MESSAGES_PREFIX}{self.chat_id}'
            await self.redis_connection.zadd(
                redis_key,
                {json.dumps(message): float(message['timestamp'])}
            )
            
            await self.redis_connection.expire(redis_key, 7 * 24 * 60 * 60)
            
        except Exception as e:
            print(f"Error storing message: {e}")
            raise

    async def update_message_status(self, message_id: str, status: str):
        """
        Updates message delivery status in Redis.
        """
        try:
            redis_key = f'{self.CHAT_MESSAGES_PREFIX}{self.chat_id}'
            message_data = await self.redis_connection.zrange(
                redis_key,
                0,
                -1,
                withscores=True
            )
            
            for msg, score in message_data:
                msg_dict = json.loads(msg)
                if msg_dict['id'] == message_id:
                    msg_dict['status'] = status
                    await self.redis_connection.zadd(
                        redis_key,
                        {json.dumps(msg_dict): score}
                    )
                    break
                    
        except Exception as e:
            print(f"Error updating message status: {e}")

    async def check_rate_limit(self) -> bool:
        """
        Implements rate limiting for message sending.
        Returns False if rate limit is exceeded.
        """
        try:
            key = f'{self.RATE_LIMIT_PREFIX}{self.chat_id}:{self.user_id}'
            current = await self.redis_connection.incr(key)
            
            if current == 1:
                await self.redis_connection.expire(key, 60)

            return current <= settings.MAX_MESSAGES_PER_MINUTE
            
        except Exception as e:
            print(f"Error checking rate limit: {e}")
            return True

    async def get_last_seen(self) -> Optional[str]:
        """
        Retrieves the last seen message ID for reconnection handling.
        """
        try:
            key = f'{self.LAST_SEEN_PREFIX}{self.chat_id}:{self.user_id}'
            return await self.redis_connection.get(key)
        except Exception as e:
            print(f"Error getting last seen: {e}")
            return None

    async def update_last_seen(self):
        """
        Updates the last seen message timestamp for the user.
        """
        try:
            if self.last_seen_message_id:
                key = f'{self.LAST_SEEN_PREFIX}{self.chat_id}:{self.user_id}'
                await self.redis_connection.set(
                    key,
                    self.last_seen_message_id,
                    ex=7 * 24 * 60 * 60
                )
        except Exception as e:
            print(f"Error updating last seen: {e}")

    async def mark_user_online(self):
        """
        Marks user as online in the chat.
        """
        try:
            await self.redis_connection.sadd(
                f'{self.ONLINE_USERS_PREFIX}{self.chat_id}',
                self.user_id
            )
        except Exception as e:
            print(f"Error marking user online: {e}")

    async def mark_user_offline(self):
        """
        Marks user as offline in the chat.
        """
        try:
            await self.redis_connection.srem(
                f'{self.ONLINE_USERS_PREFIX}{self.chat_id}',
                self.user_id
            )
        except Exception as e:
            print(f"Error marking user offline: {e}")

    async def notify_user_presence(self, event_type: str):
        """
        Notifies chat participants about user presence changes.
        """
        try:
            await self.channel_layer.group_send(
                self.chat_group_name,
                {
                    'type': event_type,
                    'user_id': self.user_id
                }
            )
        except Exception as e:
            print(f"Error notifying user presence: {e}")

    async def send_error(self, message: str):
        """
        Sends error message to the client.
        """
        await self.send(json.dumps({
            'type': 'error',
            'message': message
        }))

    async def handle_connection_error(self, error: Exception):
        """
        Enhanced error handler that safely closes the connection without triggering
        the transfer_data_task issue.
        """
        error_code = 4000
        if isinstance(error, redis.RedisError):
            error_code = 4002
        elif isinstance(error, ValueError):
            error_code = 4001

        try:
            await self.close(code=error_code)
        except Exception as e:
            try:
                await self.channel_layer.group_discard(
                    self.chat_group_name,
                    self.channel_name
                )
                await self.disconnect(error_code)
            except Exception:
                pass
            
        print(f"Connection error: {error}")

    async def get_redis_connection(self) -> redis.Redis:
        """
        Creates and returns a Redis connection with error handling.
        """
        try:
            return redis.Redis(
                host=settings.REDIS_HOST,
                port=settings.REDIS_PORT,
                password=settings.REDIS_PASSWORD,
                decode_responses=True
            )
        except Exception as e:
            print(f"Redis connection error: {e}")
            raise

    @database_sync_to_async
    def check_chat_membership(self, chat_id: str, user_id: str) -> bool:
        """
        Verifies user's membership in the chat using database query.
        
        Args:
            chat_id (str): The UUID of the chat to check
            user_id (str): The UUID of the user to verify
            
        Returns:
            bool: True if the user is a member of the chat and the chat is active,
                 False otherwise
        """
        from .models import PersonalChat
        
        try:
            chat_exists = PersonalChat.objects.filter(
                id=chat_id,
                is_active=True
            ).filter(
                Q(user1_id=user_id) | Q(user2_id=user_id)
            ).exists()
            
            return chat_exists
            
        except Exception as e:
            print(f"Error checking chat membership: {e}")
            return False