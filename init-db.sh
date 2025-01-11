#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Create database
    CREATE DATABASE $AUTH_DB_NAME;

    -- Create user
    CREATE USER $AUTH_DB_USER WITH PASSWORD '$AUTH_DB_PASSWORD';

    -- Grant all privileges on database
    GRANT ALL PRIVILEGES ON DATABASE $AUTH_DB_NAME TO $AUTH_DB_USER;
    
    -- Connect to the new database
    \c $AUTH_DB_NAME

    -- Grant schema permissions
    GRANT ALL ON SCHEMA public TO $AUTH_DB_USER;
    ALTER USER $AUTH_DB_USER CREATEDB;
EOSQL