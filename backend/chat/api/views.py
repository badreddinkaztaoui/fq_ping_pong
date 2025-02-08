import asyncio
import datetime
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
from .models import Messages, BlockUsers
from .serializers import MessageSerializer


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
            user = request.user.id
            
            blocked_users = BlockUsers.objects.filter(blocker=user).values_list('blocked', flat=True)
            
            last_messages = (
                Messages.objects.filter(
                    (Q(sender=user) | Q(receiver=user)) & 
                    ~Q(sender__in=blocked_users) & 
                    ~Q(receiver__in=blocked_users)
                )
                .order_by('-time')
            )

            conversations = {}
            for message in last_messages:

                if message.sender == user:
                    other_user = message.receiver
                else:
                    other_user = message.sender
                

                if other_user not in conversations:
                    conversations[other_user] = {
                        "user_id": other_user,
                        "last_message": message.content,
                        "last_message_time": message.time
                    }

            sorted_conversations = sorted(
                conversations.values(), 
                key=lambda x: x["last_message_time"], 
                reverse=True
            )

            for convo in sorted_conversations:
                if isinstance(convo["last_message_time"], datetime.datetime):
                    convo["last_message_time"] = convo["last_message_time"].strftime('%Y-%m-%d %H:%M')

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
