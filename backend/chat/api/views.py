from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q
from django.conf import settings
from django.db import connections
from django.db.utils import OperationalError
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
    Verifies the other user exists via auth service before creating chat.
    """
    friend_id = request.data.get('friend_id')
    current_user_id = str(request.user.id)
    
    if not friend_id:
        return Response(
            {'error': 'friend_id is required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{settings.AUTH_SERVICE_URL}/api/users/{friend_id}/",
                headers={'Authorization': f'Bearer {request.auth}'}
            ) as response:
                if response.status != 200:
                    return Response(
                        {'error': 'User not found or unauthorized'},
                        status=status.HTTP_404_NOT_FOUND
                    )
    except Exception as e:
        return Response(
            {'error': f'Failed to verify user: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    existing_chat = PersonalChat.objects.filter(
        (Q(user1_id=current_user_id) & Q(user2_id=friend_id)) |
        (Q(user1_id=friend_id) & Q(user2_id=current_user_id))
    ).first()

    if existing_chat:
        serializer = PersonalChatSerializer(existing_chat)
        return Response(serializer.data)

    new_chat = PersonalChat.objects.create(
        user1_id=current_user_id,
        user2_id=friend_id
    )
    
    serializer = PersonalChatSerializer(new_chat)
    return Response(serializer.data, status=status.HTTP_201_CREATED)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_chats(request):
    """
    Retrieve all chats for the current user.
    Supports pagination and optional filtering.
    """
    user_id = request.user.id
    
    limit = int(request.query_params.get('limit', 50))
    offset = int(request.query_params.get('offset', 0))
    
    chats = PersonalChat.objects.filter(
        Q(user1_id=user_id) | Q(user2_id=user_id)
    ).order_by('-last_message_at')[offset:offset+limit]
    
    serializer = PersonalChatSerializer(chats, many=True)
    
    return Response({
        'chats': serializer.data,
        'total_count': PersonalChat.objects.filter(
            Q(user1_id=user_id) | Q(user2_id=user_id)
        ).count(),
        'limit': limit,
        'offset': offset
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_chat_messages(request, chat_id):
    """
    Retrieve messages for a specific chat.
    Supports pagination and includes total message count.
    """
    try:
        chat = PersonalChat.objects.get(
            Q(user1_id=str(request.user.id)) | Q(user2_id=str(request.user.id)),
            id=chat_id
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
    Validates chat membership and message content.
    """
    try:
        chat = PersonalChat.objects.get(
            Q(user1_id=request.user.id) | Q(user2_id=request.user.id),
            id=chat_id,
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
        sender_id=request.user.id,
        content=content
    )

    chat.last_message_at = message.created_at
    chat.save()

    serializer = PersonalMessageSerializer(message)
    return Response(serializer.data, status=status.HTTP_201_CREATED)