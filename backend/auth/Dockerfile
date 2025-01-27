FROM python:3.11-alpine

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DJANGO_SETTINGS_MODULE=core.settings

WORKDIR /app

COPY requirements.txt .
RUN apk add --no-cache \
    postgresql-dev \
    curl \
    gcc \
    python3-dev \
    musl-dev \
    linux-headers \
    && pip3 install --no-cache-dir -r requirements.txt

COPY . /app

RUN mkdir -p /app/static /app/media/avatars && \
    chmod -R 777 /app/static && \
    chmod -R 777 /app/media

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8001/api/auth/health/ || exit 1