from urllib.parse import parse_qs
from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from django.db.models import Q
from django.conf import settings
from .utils import AuthServiceError, verify_token_with_auth_service
import json

class WebSocketAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        """
        Handle WebSocket authentication using JWT tokens from either cookies or query parameters.
        Verifies the token with the auth service and checks chat access permissions.
        """
        token = await self.get_token_from_cookies(scope)
        
        if not token:
            token = await self.get_token_from_query(scope)

        if not token:
            await self.close_connection(send, "Authentication required")
            return
        
        try:
            user_data = await verify_token_with_auth_service(token)
            
            if not user_data:
                await self.close_connection(send, "Invalid token")
                return
            
            chat_id = self.get_chat_id_from_path(scope.get('path', ''))
            if chat_id:
                can_access = await self.verify_chat_access(chat_id, user_data['id'])
                if not can_access:
                    await self.close_connection(send, "Unauthorized chat access")
                    return

            scope['user'] = user_data
            return await super().__call__(scope, receive, send)
                
        except AuthServiceError as e:
            await self.close_connection(send, "Authentication service unavailable")
            return
        except Exception as e:
            await self.close_connection(send, f"Authentication failed: {str(e)}")
            return

    async def get_token_from_cookies(self, scope):
        """
        Extract JWT token from request cookies.
        """
        try:
            headers = dict(scope.get('headers', []))
            cookie_header = headers.get(b'cookie', b'').decode()
            
            if not cookie_header:
                return None

            cookies = {}
            for cookie in cookie_header.split(';'):
                if '=' in cookie:
                    name, value = cookie.strip().split('=', 1)
                    cookies[name.strip()] = value.strip()

            return cookies.get(settings.SIMPLE_JWT['AUTH_COOKIE'])
        except Exception:
            return None

    async def get_token_from_query(self, scope):
        """
        Extract JWT token from query parameters.
        """
        try:
            query_string = scope.get('query_string', b'').decode()
            query_params = parse_qs(query_string)
            token = query_params.get('token', [None])[0]
            return token
        except Exception:
            return None

    def get_chat_id_from_path(self, path):
        """
        Extract chat ID from WebSocket path.
        """
        try:
            parts = path.split('/')
            if len(parts) >= 3 and parts[1] == 'chat':
                return parts[2]
            return None
        except Exception:
            return None

    @database_sync_to_async
    def verify_chat_access(self, chat_id, user_id):
        """
        Verify that the user has access to the requested chat.
        """
        from .models import PersonalChat
        try:
            return PersonalChat.objects.filter(
                Q(user1_id=user_id) | Q(user2_id=user_id),
                id=chat_id,
                is_active=True
            ).exists()
        except Exception:
            return False
    
    async def close_connection(self, send, reason):
        """
        Close the WebSocket connection with an error message.
        """
        await send({
            'type': 'websocket.close',
            'code': 4001,
            'text': json.dumps({'error': reason})
        })