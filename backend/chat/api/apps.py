from django.apps import AppConfig

class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'
    
    def ready(self):
        """
        Initialize any application-specific startup tasks here.
        For example, setting up signal handlers or scheduled tasks.
        """
        pass