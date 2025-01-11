#!/bin/bash

declare -A ENDPOINTS=(
    ["frontend"]="http://frontend:3000"
    ["auth"]="http://auth:8001/api/auth/health/"
)

LOG_FILE="/var/log/nginx/healthcheck.log"
TIMEOUT=5 

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

check_service() {
    local service=$1
    local endpoint=$2
    local start_time=$(date +%s)

    log "Checking $service at $endpoint"

    response=$(curl -s -m $TIMEOUT \
                    -w "\n%{http_code}" \
                    -H "Accept: application/json" \
                    -H "User-Agent: HealthCheck/1.0" \
                    "$endpoint" 2>&1)
    
    local status=$?
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    if [ $status -ne 0 ]; then
        log "ERROR: $service check failed. Curl error: $status. Duration: ${duration}s"
        return 1
    fi

    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | sed '$d')

    if [ "$http_code" != "200" ]; then
        log "ERROR: $service returned HTTP $http_code. Duration: ${duration}s"
        return 1
    fi

    if [ "$service" != "frontend" ]; then
        if ! echo "$body" | grep -q "healthy"; then
            log "ERROR: $service is not healthy. Response: $body. Duration: ${duration}s"
            return 1
        fi
    fi

    log "SUCCESS: $service is healthy. Duration: ${duration}s"
    return 0
}

main() {
    local all_healthy=true

    touch $LOG_FILE

    log "Starting health checks..."

    for service in "${!ENDPOINTS[@]}"; do
        if ! check_service "$service" "${ENDPOINTS[$service]}"; then
            all_healthy=false
            break
        fi
    done

    if $all_healthy; then
        log "All services are healthy"
        exit 0
    else
        log "Health check failed"
        exit 1
    fi
}

trap 'echo "Health check interrupted"; exit 1' SIGINT SIGTERM

main