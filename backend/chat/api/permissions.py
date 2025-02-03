from rest_framework import permissions
from django.db.models import Q

class CanAccessChat(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, chat):
        user_id = str(request.user.id)
        return (
            str(chat.user1_id) == user_id or 
            str(chat.user2_id) == user_id
        )