from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework import exceptions
from django.conf import settings
from django.middleware.csrf import CsrfViewMiddleware

class CSRFCheck(CsrfViewMiddleware):
    def _reject(self, request, reason):
        return reason

class JWTCookieAuthentication(JWTAuthentication):
    def authenticate(self, request):
        if request.path in ['/api/auth/login/', '/api/auth/register/']:
            pass
        elif request.method not in ['GET', 'HEAD', 'OPTIONS', 'POST']:
            self.enforce_csrf(request)

        token = request.COOKIES.get(settings.SIMPLE_JWT['AUTH_COOKIE'])
        
        if not token:
            return None

        try:
            validated_token = self.get_validated_token(token)
            user = self.get_user(validated_token)
            return user, validated_token
        except Exception:
            return None

    def enforce_csrf(self, request):
        check = CSRFCheck(lambda req: None)
        check.process_request(request)
        reason = check.process_view(request, None, (), {})
        if reason:
            raise exceptions.PermissionDenied(f'CSRF Failed: {reason}')