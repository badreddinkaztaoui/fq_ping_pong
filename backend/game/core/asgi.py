import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

from django.core.asgi import get_asgi_application
django_asgi_app = get_asgi_application()

from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from api.middleware import WebSocketAuthMiddleware
from api.routing import websocket_urlpatterns

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    # "websocket": URLRouter(websocket_urlpatterns)
    "websocket": WebSocketAuthMiddleware(
        URLRouter(websocket_urlpatterns)
    )
})
