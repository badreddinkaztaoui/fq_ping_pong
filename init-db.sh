#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Create databases
    CREATE DATABASE $AUTH_DB_NAME;

    -- Create users and grant privileges
    CREATE USER $AUTH_DB_USER WITH PASSWORD '$AUTH_DB_PASSWORD';

    -- Grant privileges
    GRANT ALL PRIVILEGES ON DATABASE $AUTH_DB_NAME TO $AUTH_DB_USER;
EOSQL