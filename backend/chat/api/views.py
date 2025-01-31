import uuid
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q
from django.conf import settings
from django.db import connections
from django.db.utils import OperationalError
from channels.db import database_sync_to_async
import aiohttp
import asyncio

from .models import PersonalChat, PersonalMessage
from .serializers import PersonalChatSerializer, PersonalMessageSerializer

class ChatHealthCheck(APIView):
    """
    Health check endpoint for the chat service.
    Verifies database connection and auth service connectivity.
    """
    permission_classes = [AllowAny]
    
    async def check_auth_service(self):
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{settings.AUTH_SERVICE_URL}/api/auth/health/",
                    timeout=5
                ) as response:
                    if response.status == 200:
                        return True, await response.json()
                    return False, f'Auth service returned status {response.status}'
        except Exception as e:
            return False, f'Failed to connect to auth service: {str(e)}'

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

        auth_status, auth_message = asyncio.run(self.check_auth_service())
        health_status['auth_service'] = 'available' if auth_status else 'unavailable'
        if not auth_status:
            health_status['status'] = 'unhealthy'
            health_status['auth_message'] = auth_message

        response_status = (
            status.HTTP_200_OK 
            if health_status['status'] == 'healthy' 
            else status.HTTP_503_SERVICE_UNAVAILABLE
        )

        return Response(health_status, status=response_status)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
async def start_chat(request):
    """
    Start a new chat with another user.
    Handles UUIDs for both current user and friend, verifies friendship status,
    and creates or retrieves the chat session.
    """
    friend_id = request.data.get('friend_id')
    current_user_id = request.user['id']

    try:
        current_user_uuid = uuid.UUID(str(current_user_id))
        friend_uuid = uuid.UUID(str(friend_id))
    except (ValueError, TypeError, AttributeError):
        return Response(
            {'error': 'Invalid user ID format'},
            status=status.HTTP_400_BAD_REQUEST
        )

    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return Response(
            {'error': 'Authorization header required'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    token = auth_header.split(' ')[1]

    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{settings.AUTH_SERVICE_URL}/api/auth/friends/status/{friend_uuid}/",
                headers={'Authorization': f'Bearer {token}'}
            ) as response:
                if response.status != 200:
                    return Response(
                        {'error': 'Failed to verify friendship status'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                status_data = await response.json()
                if not status_data.get('is_friend'):
                    return Response(
                        {'error': 'Users must be friends to start a chat'},
                        status=status.HTTP_403_FORBIDDEN
                    )
                
                if status_data.get('is_blocked'):
                    return Response(
                        {'error': 'Cannot start chat with blocked user'},
                        status=status.HTTP_403_FORBIDDEN
                    )

    except Exception as e:
        return Response(
            {'error': f'Failed to verify friendship: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    @database_sync_to_async
    def get_existing_chat():
        try:
            user1_str = str(current_user_uuid)
            user2_str = str(friend_uuid)
            
            return PersonalChat.objects.filter(
                Q(user1_id__exact=user1_str) & Q(user2_id__exact=user2_str) |
                Q(user1_id__exact=user2_str) & Q(user2_id__exact=user1_str)
            ).first()
        except Exception as e:
            print(f"Query error: {e}")
            return None

    @database_sync_to_async
    def create_chat():
        try:
            return PersonalChat.objects.create(
                user1_id=str(current_user_uuid),
                user2_id=str(friend_uuid)
            )
        except Exception as e:
            print(f"Creation error: {e}")
            raise

    @database_sync_to_async
    def serialize_chat(chat):
        return PersonalChatSerializer(chat, context={'request': request}).data

    existing_chat = await get_existing_chat()
    if existing_chat:
        serialized_data = await serialize_chat(existing_chat)
        return Response(serialized_data)

    new_chat = await create_chat()
    serialized_data = await serialize_chat(new_chat)
    return Response(serialized_data, status=status.HTTP_201_CREATED)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_chats(request):
    """
    Retrieve all chats for the current user.
    Supports pagination and handles UUID conversion for user identification.
    """
    try:
        user_uuid = uuid.UUID(str(request.user['id']))
    except (ValueError, TypeError, AttributeError):
        return Response(
            {'error': 'Invalid user ID format'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    limit = int(request.query_params.get('limit', 50))
    offset = int(request.query_params.get('offset', 0))
    
    chats = PersonalChat.objects.filter(
        Q(user1_id=user_uuid) | Q(user2_id=user_uuid)
    ).order_by('-last_message_at')[offset:offset+limit]
    
    serializer = PersonalChatSerializer(chats, many=True, context={'request': request})
    
    total_count = PersonalChat.objects.filter(
        Q(user1_id=user_uuid) | Q(user2_id=user_uuid)
    ).count()
    
    return Response({
        'chats': serializer.data,
        'total_count': total_count,
        'limit': limit,
        'offset': offset
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_chat_messages(request, chat_id):
    """
    Retrieve messages for a specific chat.
    Handles UUID conversion for both chat and user IDs.
    """
    try:
        user_uuid = uuid.UUID(str(request.user['id']))
        chat_uuid = uuid.UUID(str(chat_id))
    except (ValueError, TypeError, AttributeError):
        return Response(
            {'error': 'Invalid ID format'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        chat = PersonalChat.objects.get(
            Q(user1_id=user_uuid) | Q(user2_id=user_uuid),
            id=chat_uuid
        )
    except PersonalChat.DoesNotExist:
        return Response(
            {'error': 'Chat not found or unauthorized'},
            status=status.HTTP_404_NOT_FOUND
        )

    limit = int(request.query_params.get('limit', 50))
    offset = int(request.query_params.get('offset', 0))
    
    messages = PersonalMessage.objects.filter(
        chat=chat
    ).order_by('-created_at')[offset:offset+limit]
    
    serializer = PersonalMessageSerializer(messages, many=True)
    
    return Response({
        'messages': serializer.data,
        'total_count': chat.messages.count(),
        'limit': limit,
        'offset': offset
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_message(request, chat_id):
    """
    Send a new message in a specific chat.
    Handles UUID conversion and validates chat membership.
    """
    try:
        user_uuid = uuid.UUID(str(request.user['id']))
        chat_uuid = uuid.UUID(str(chat_id))
    except (ValueError, TypeError, AttributeError):
        return Response(
            {'error': 'Invalid ID format'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        chat = PersonalChat.objects.get(
            Q(user1_id=user_uuid) | Q(user2_id=user_uuid),
            id=chat_uuid,
            is_active=True
        )
    except PersonalChat.DoesNotExist:
        return Response(
            {'error': 'Chat not found or unauthorized'},
            status=status.HTTP_404_NOT_FOUND
        )

    content = request.data.get('content')
    if not content:
        return Response(
            {'error': 'Message content is required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    message = PersonalMessage.objects.create(
        chat=chat,
        sender_id=user_uuid,
        content=content
    )

    chat.last_message_at = message.created_at
    chat.save()

    serializer = PersonalMessageSerializer(message)
    return Response(serializer.data, status=status.HTTP_201_CREATED)