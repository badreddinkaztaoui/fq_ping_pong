from urllib.parse import parse_qs
from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from django.db.models import Q
from django.conf import settings
from .utils import verify_token_with_auth_service

class WebSocketAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        if scope["type"] != "websocket":
            return await super().__call__(scope, receive, send)

        try:
            print(f"Processing WebSocket connection request for path: {scope.get('path', '')}")
            
            token = await self.get_token_from_cookies(scope)
            if not token:
                token = await self.get_token_from_query(scope)
                print(f"Using token from query parameters: {bool(token)}")
            
            if not token:
                print("No token found in cookies or query parameters")
                return await self.close_connection_safe(send, "Authentication required")

            user_data = await verify_token_with_auth_service(token)
            print(f"Token verification result: {bool(user_data)}")

            if not user_data:
                return await self.close_connection_safe(send, "Invalid token")

            scope['user'] = user_data
            return await super().__call__(scope, receive, send)

        except Exception as e:
            print(f"WebSocket middleware error: {str(e)}")
            return await self.close_connection_safe(send, f"Authentication failed: {str(e)}")

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
    
    async def close_connection_safe(self, send, reason):
        """
        Safely close the WebSocket connection with enhanced error handling.
        This implementation avoids the transfer_data_task issue by using a simpler close sequence.
        """
        try:
            await send({
                "type": "websocket.close",
                "code": 4001
            })
        except Exception as e:
            print(f"Error during connection close: {str(e)}")
            try:
                await send({"type": "websocket.disconnect"})
            except Exception:
                pass
        return