import os
from pathlib import Path
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv('DJANGO_SECRET_KEY')

DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'

ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

DJANGO_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

THIRD_PARTY_APPS = [
    'rest_framework',
    'corsheaders',
    'channels',
    'drf_spectacular',
]

LOCAL_APPS = [
    'api',
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

ROOT_URLCONF = 'core.urls'
ASGI_APPLICATION = 'core.asgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('POSTGRES_DB'),
        'USER': os.getenv('GAME_DB_USER'),
        'PASSWORD': os.getenv('GAME_DB_PASSWORD'),
        'HOST': os.getenv('DB_HOST'),
        'PORT': os.getenv('DB_PORT'),
        'OPTIONS': {
            'options': '-c search_path=game,auth,public'
        }
    }
}

REDIS_HOST = os.getenv('REDIS_HOST', 'redis')
REDIS_PORT = int(os.getenv('REDIS_PORT', 6379))
REDIS_PASSWORD = os.getenv('REDIS_PASSWORD')

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [{
                'host': REDIS_HOST,
                'port': REDIS_PORT,
                'password': REDIS_PASSWORD,
            }],
            'prefix': os.getenv('CHANNEL_REDIS_PREFIX', 'game'),
        },
    },
}


CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': f"redis://{REDIS_HOST}:{REDIS_PORT}/0",
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'PASSWORD': REDIS_PASSWORD,
        }
    }
}

WEBSOCKET_MAX_CONNECTIONS = int(os.getenv('WS_MAX_CONNECTIONS', 1000))
WEBSOCKET_TIMEOUT = int(os.getenv('WS_TIMEOUT', 60))

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'api.authentication.GameJWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

GAME_SETTINGS = {
    'MATCHMAKING_TIMEOUT': 60,
    'GAME_TICK_RATE': 60,
    'PADDLE_SPEED': 10,
    'BALL_SPEED': 15,
    'COURT_WIDTH': 800,
    'COURT_HEIGHT': 600,
    'POINTS_TO_WIN': 11,
}



JWT_SIGNING_KEY = os.getenv('JWT_SIGNING_KEY')

SIMPLE_JWT = {
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'SIGNING_KEY': JWT_SIGNING_KEY,
    'ALGORITHM': 'HS256',
    'VERIFYING_KEY': JWT_SIGNING_KEY,
    'AUTH_COOKIE': 'access_token',
    'AUTH_COOKIE_REFRESH': 'refresh_token',
    'AUTH_COOKIE_DOMAIN': 'localhost',
    'AUTH_COOKIE_SECURE': not DEBUG,
    'AUTH_COOKIE_HTTP_ONLY': True,
    'AUTH_COOKIE_PATH': '/',
    'AUTH_COOKIE_SAMESITE': 'Lax',
}

SESSION_COOKIE_DOMAIN = 'localhost'
SESSION_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_NAME = 'sessionid'
SESSION_COOKIE_HTTPONLY = True

CSRF_COOKIE_NAME = 'csrftoken'
CSRF_COOKIE_DOMAIN = 'localhost'
CSRF_COOKIE_SECURE = True
CSRF_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_HTTPONLY = False

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = ['http://localhost:8000']
CSRF_TRUSTED_ORIGINS = ['http://localhost:8000']

CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

AUTH_SERVICE_TIMEOUT = int(os.getenv('AUTH_SERVICE_TIMEOUT', 5))
AUTH_SERVICE_URL = os.getenv('AUTH_SERVICE_URL', 'http://auth:8000')
JWT_VERIFICATION_URL = f"{AUTH_SERVICE_URL}/api/auth/verify/"

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'loggers': {
        'api': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
    },
}

GAME_SETTINGS = {
    'MATCHMAKING_TIMEOUT': int(os.getenv('MATCHMAKING_TIMEOUT', 60)),
    'MAX_GAME_DURATION': int(os.getenv('MAX_GAME_DURATION', 600)),
    'GAME_TICK_RATE': int(os.getenv('GAME_TICK_RATE', 60)),
    'PADDLE_SPEED': float(os.getenv('PADDLE_SPEED', 10)),
    'BALL_SPEED': float(os.getenv('BALL_SPEED', 15)),
    'COURT_WIDTH': int(os.getenv('COURT_WIDTH', 800)),
    'COURT_HEIGHT': int(os.getenv('COURT_HEIGHT', 600)),
    'DEFAULT_POINTS_TO_WIN': int(os.getenv('DEFAULT_POINTS_TO_WIN', 11)),
    'HARDCORE_BALL_SPEED_MULTIPLIER': float(os.getenv('HARDCORE_BALL_SPEED_MULTIPLIER', 1.5)),
    'HARDCORE_PADDLE_SIZE_MULTIPLIER': float(os.getenv('HARDCORE_PADDLE_SIZE_MULTIPLIER', 0.8)),
}

STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'static')

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'