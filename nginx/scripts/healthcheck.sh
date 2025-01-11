#!/bin/bash

services=("frontend" "auth" "game" "chat")
all_healthy=true

for service in "${services[@]}"; do
    if [[ "$service" == "frontend" ]]; then
        response=$(curl -s http://localhost:80)
        if [ $? -ne 0 ]; then
            all_healthy=false
            break
        fi
    else
        response=$(curl -s http://localhost:80/api/$service/health/)
        if [ $? -ne 0 ] || ! echo "$response" | grep -q "healthy"; then
            all_healthy=false
            break
        fi
    fi
done

if $all_healthy; then
    exit 0
else
    exit 1
fi
