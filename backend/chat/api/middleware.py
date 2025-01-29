from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from .utils import verify_token_with_auth_service, AuthServiceError
from urllib.parse import parse_qs
import json

class WebSocketAuthMiddleware(BaseMiddleware):
    """
    Custom middleware for WebSocket authentication using JWT tokens.
    Verifies tokens with the auth service and adds user data to the scope.
    """
    
    async def __call__(self, scope, receive, send):
        query_string = scope.get('query_string', b'').decode()
        query_params = parse_qs(query_string)
        token = query_params.get('token', [None])[0]
        
        if not token:
            await self.close_connection(send, "Authentication required")
            return
        
        try:
            user_data = await verify_token_with_auth_service(token)
            
            if user_data:
                scope['user'] = user_data
                return await super().__call__(scope, receive, send)
            else:
                await self.close_connection(send, "Invalid token")
                return
                
        except AuthServiceError as e:
            await self.close_connection(send, "Authentication service unavailable")
            return
    
    async def close_connection(self, send, reason):
        """Helper method to close WebSocket connection with error message"""
        await send({
            'type': 'websocket.close',
            'code': 4001,
            'text': json.dumps({'error': reason})
        })