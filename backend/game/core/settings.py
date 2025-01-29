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

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [(
                os.getenv('REDIS_HOST', 'redis'),
                int(os.getenv('REDIS_PORT', 6379))
            )],
            'prefix': os.getenv('CHANNEL_REDIS_PREFIX', 'game'),
            'capacity': 1500,
        },
    },
}

CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': f"redis://{os.getenv('REDIS_HOST', 'redis')}:{os.getenv('REDIS_PORT', 6379)}/0",
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'PASSWORD': os.getenv('REDIS_PASSWORD', None),
        }
    }
}

WEBSOCKET_MAX_CONNECTIONS = int(os.getenv('WS_MAX_CONNECTIONS', 1000))
WEBSOCKET_TIMEOUT = int(os.getenv('WS_TIMEOUT', 60))

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
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


CORS_ALLOWED_ORIGINS = os.getenv('CORS_ALLOWED_ORIGINS', 'http://localhost:8000').split(',')
CORS_ALLOW_CREDENTIALS = True

AUTH_USER_MODEL = 'api.User'

SIMPLE_JWT = {
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
}

AUTH_SERVICE_URL = os.getenv('AUTH_SERVICE_URL', 'http://auth:8001')
JWT_VERIFICATION_URL = f"{AUTH_SERVICE_URL}/api/auth/verify/"

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