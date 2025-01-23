from django.apps import AppConfig

class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'
    
    def ready(self):
        """
        Initialize game-specific startup tasks.
        This could include setting up background tasks for:
        - Cleaning up abandoned games
        - Updating player statistics
        - Managing matchmaking queues
        """
        try:
            from . import signals
        except ImportError:
            pass