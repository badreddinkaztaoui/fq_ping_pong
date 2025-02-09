import asyncio
import aiohttp
import logging
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.renderers import JSONRenderer
from django.db.models import Q
from asgiref.sync import async_to_sync
from django.conf import settings
from django.db import connections
from django.db.utils import OperationalError
from .models import Messages, BlockUsers
from .serializers import MessageSerializer
from .utils import get_user_from_id


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



class ListMessagesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, sender):
        try:
            receiver_id = request.user.id
            sender_id = sender
            

            logger.info(receiver_id)
            logger.info(sender_id)

            message = Messages.objects.filter(
            Q(sender=sender_id, receiver=receiver_id) | Q(sender=receiver_id, receiver=sender_id)).order_by('time')
            return Response(MessageSerializer(message, many=True).data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_404_NOT_FOUND)



class ListLatestConversasions(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user_id = request.user.id
            blocked_users = BlockUsers.objects.filter(blocker=user_id).values_list('blocked', flat=True)
            
            last_messages = (
                Messages.objects.filter(
                    (Q(sender=user_id) | Q(receiver=user_id)) &
                    ~Q(sender__in=blocked_users) &
                    ~Q(receiver__in=blocked_users)
                )
                .order_by('-time')
            )

            conversations = {}
            for msg in last_messages:
                other_user = msg.receiver if str(msg.sender) == user_id else msg.sender
                if other_user not in conversations:
                    conversations[other_user] = {
                        "user_id": other_user,
                        "user": async_to_sync(get_user_from_id)(other_user, request.token),
                        "last_message": msg.content,
                        "last_message_time": msg.time.strftime('%Y-%m-%d %H:%M')
                    }

            # Already in descending order due to .order_by('-time'), but if needed:
            sorted_conversations = sorted(
                conversations.values(),
                key=lambda x: x["last_message_time"],
                reverse=True
            )
            
            return Response(sorted_conversations, status=status.HTTP_200_OK)
        
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)



class BlockUsersView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            user = request.user.id
            blocked_users = BlockUsers.objects.filter(blocker=user)
            return Response(list(blocked_users), status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    

    def post(self, request):
        try:
            blocker = request.user.id
            blocked = request.data.get('user_id')
            
            BlockUsers.objects.filter(blocker=blocker, blocked=blocked).delete()
            return Response({"message": f"You have unblocked {blocked}."}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


    def delete(self, request):
        try:
            blocker = request.user.id
            blocked = request.data.get('user_id')
            
            BlockUsers.objects.filter(blocker=blocker, blocked=blocked).delete()
            return Response({"message": f"You have unblocked {blocked}."}, status=status.HTTP_204_NO_CONTENT)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
