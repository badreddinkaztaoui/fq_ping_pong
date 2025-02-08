from django.contrib.contenttypes.models import ContentType
from django.urls import reverse
from .models import Notification

class NotificationService:
    @staticmethod
    def create_notification(recipient, notification_type, title, message, related_object=None, action_url=None):
        """
        Creates a new notification for a user.
        """
        notification = Notification(
            recipient=recipient,
            notification_type=notification_type,
            title=title,
            message=message,
            action_url=action_url
        )
        
        if related_object:
            content_type = ContentType.objects.get_for_model(related_object)
            notification.content_type = content_type
            notification.object_id = related_object.id
            
        notification.save()
        return notification

    @staticmethod
    def create_friend_request_notification(friendship):
        """
        Creates a notification for a new friend request.
        """
        action_url = reverse('get_friend_requests')
        return NotificationService.create_notification(
            recipient=friendship.friend,
            notification_type=Notification.TYPE_FRIEND_REQUEST,
            title='New Friend Request',
            message=f'{friendship.user.username} sent you a friend request',
            related_object=friendship,
            action_url=action_url
        )

    @staticmethod
    def create_friend_accept_notification(friendship):
        """
        Creates a notification when a friend request is accepted.
        """
        action_url = reverse('get_friends')
        return NotificationService.create_notification(
            recipient=friendship.user,
            notification_type=Notification.TYPE_FRIEND_ACCEPT,
            title='Friend Request Accepted',
            message=f'{friendship.friend.username} accepted your friend request',
            related_object=friendship,
            action_url=action_url
        )

    @staticmethod
    def create_friend_reject_notification(friendship):
        """
        Creates a notification when a friend request is rejected.
        """
        return NotificationService.create_notification(
            recipient=friendship.user,
            notification_type=Notification.TYPE_FRIEND_REJECT,
            title='Friend Request Rejected',
            message=f'{friendship.friend.username} declined your friend request',
            related_object=friendship
        )

    @staticmethod
    def mark_as_read(notification_id, user):
        """
        Marks a notification as read.
        """
        try:
            notification = Notification.objects.get(id=notification_id, recipient=user)
            notification.mark_as_read()
            return True
        except Notification.DoesNotExist:
            return False

    @staticmethod
    def mark_all_as_read(user):
        """
        Marks all notifications for a user as read.
        """
        Notification.objects.filter(recipient=user, is_read=False).update(is_read=True)

    @staticmethod
    def get_unread_count(user):
        """
        Gets the count of unread notifications for a user.
        """
        return Notification.objects.filter(recipient=user, is_read=False).count()