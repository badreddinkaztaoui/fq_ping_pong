from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from django.db.models import Q
from urllib.parse import parse_qs
import json

class WebSocketAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        from .models import PersonalChat
        from .utils import verify_token_with_auth_service, AuthServiceError
        
        query_string = scope.get('query_string', b'').decode()
        query_params = parse_qs(query_string)
        token = query_params.get('token', [None])[0]
        
        if not token:
            await self.close_connection(send, "Authentication required")
            return
        
        try:
            user_data = await verify_token_with_auth_service(token)
            
            if user_data:
                chat_id = self.get_chat_id_from_path(scope.get('path', ''))
                if chat_id:
                    can_access = await self.verify_chat_access(chat_id, user_data['id'], token)
                    if not can_access:
                        await self.close_connection(send, "Unauthorized chat access")
                        return

                scope['user'] = user_data
                return await super().__call__(scope, receive, send)
            else:
                await self.close_connection(send, "Invalid token")
                return
                
        except AuthServiceError as e:
            await self.close_connection(send, "Authentication service unavailable")
            return

    def get_chat_id_from_path(self, path):
        parts = path.split('/')
        if len(parts) >= 3 and parts[1] == 'chat':
            return parts[2]
        return None

    @database_sync_to_async
    def verify_chat_access(self, chat_id, user_id, token):
        from .models import PersonalChat
        try:
            chat = PersonalChat.objects.get(
                Q(user1_id=user_id) | Q(user2_id=user_id),
                id=chat_id,
                is_active=True
            )
            return True
            
        except PersonalChat.DoesNotExist:
            return False
    
    async def close_connection(self, send, reason):
        await send({
            'type': 'websocket.close',
            'code': 4001,
            'text': json.dumps({'error': reason})
        })