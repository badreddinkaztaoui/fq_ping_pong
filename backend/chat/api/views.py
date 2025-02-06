import asyncio
import aiohttp
import logging

from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.renderers import JSONRenderer

from django.db.models import Q
from django.conf import settings
from django.db import connections
from django.db.utils import OperationalError
from django.utils import timezone

from .models import PersonalChat, PersonalMessage
from .serializers import PersonalChatSerializer, PersonalMessageSerializer
from .permissions import CanAccessChat

logger = logging.getLogger(__name__)

class ChatHealthCheck(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    renderer_classes = [JSONRenderer]
    
    def get(self, request):
        health_status = {
            'status': 'healthy',
            'database': 'unavailable',
            'auth_service': 'unavailable'
        }

        try:
            connections['default'].ensure_connection()
            health_status['database'] = 'available'
        except OperationalError:
            health_status['status'] = 'unhealthy'
            health_status['database_message'] = 'Database connection failed'

        try:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            auth_status, auth_message = loop.run_until_complete(self.check_auth_service())
            loop.close()

            health_status['auth_service'] = 'available' if auth_status else 'unavailable'
            if not auth_status:
                health_status['status'] = 'unhealthy'
                health_status['auth_message'] = auth_message
        except Exception as e:
            health_status['status'] = 'unhealthy'
            health_status['auth_service'] = 'unavailable'
            health_status['auth_message'] = f'Error checking auth service: {str(e)}'

        response_status = (
            status.HTTP_200_OK 
            if health_status['status'] == 'healthy' 
            else status.HTTP_503_SERVICE_UNAVAILABLE
        )
        
        return Response(health_status, status=response_status)

    async def check_auth_service(self):
        timeout = aiohttp.ClientTimeout(total=settings.AUTH_SERVICE_TIMEOUT)
        try:
            async with aiohttp.ClientSession(timeout=timeout) as session:
                async with session.get(f"{settings.AUTH_SERVICE_URL}/api/auth/health/") as response:
                    if response.status == 200:
                        return True, await response.json()
                    return False, f'Auth service returned status {response.status}'
        except aiohttp.ClientConnectorError as e:
            return False, f'Connection to auth service failed: {str(e)}'
        except asyncio.TimeoutError:
            return False, 'Auth service connection timed out'
        except Exception as e:
            return False, f'Failed to connect to auth service: {str(e)}'

class StartChatView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        friend_id = request.data.get('friend_id')
        if not friend_id:
            return Response(
                {'error': 'friend_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        print(friend_id)
        try:
            chat = PersonalChat.objects.filter(
                Q(user1_id=request.user.id, user2_id=friend_id) |
                Q(user1_id=friend_id, user2_id=request.user.id),
                is_active=True
            ).first()
            
            if not chat:
                chat = PersonalChat.objects.create(
                    user1_id=request.user.id,
                    user2_id=friend_id
                )
            
            serializer = PersonalChatSerializer(
                chat, 
                context={'request': request}
            )
            return Response(serializer.data)
            
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ChatMessagesView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, chat_id):
        try:
            chat = PersonalChat.objects.filter(
                id=chat_id,
                is_active=True
            ).filter(
                Q(user1_id=request.user.id) | Q(user2_id=request.user.id)
            ).first()
            
            if not chat:
                return Response(
                    {'error': 'Chat not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            offset = int(request.query_params.get('offset', 0))
            limit = min(int(request.query_params.get('limit', 50)), 100)
            
            messages = PersonalMessage.objects.filter(
                chat=chat,
                is_deleted=False
            ).order_by('-created_at')[offset:offset + limit]
            
            total_count = PersonalMessage.objects.filter(
                chat=chat,
                is_deleted=False
            ).count()
            
            if messages:
                messages.filter(
                    status__in=['sent', 'delivered'],
                    sender_id__ne=request.user.id
                ).update(status='read')
            
            serializer = PersonalMessageSerializer(messages, many=True)
            
            return Response({
                'messages': serializer.data,
                'total_count': total_count
            })
            
        except Exception as e:
            logger.error(f"Error in ChatMessagesView: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Internal server error'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class SendMessageView(APIView):
    permission_classes = [IsAuthenticated, CanAccessChat]
    
    def post(self, request, chat_id):
        try:
            chat = PersonalChat.objects.get(id=chat_id, is_active=True)
            self.check_object_permissions(request, chat)
            
            content = request.data.get('content')
            if not content:
                return Response(
                    {'error': 'Message content is required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            message = PersonalMessage.objects.create(
                chat=chat,
                sender_id=request.user.id,
                content=content,
                status='sent'
            )
            
            chat.last_message_at = timezone.now()
            chat.save(update_fields=['last_message_at'])
            
            serializer = PersonalMessageSerializer(message)
            return Response(serializer.data)
            
        except PersonalChat.DoesNotExist:
            return Response(
                {'error': 'Chat not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )