#!/bin/bash

set -e
trap 'echo "An error occurred during database initialization. Check the logs for details."; exit 1' ERR

create_schema() {
    local schema_name=$1
    echo "Creating schema: $schema_name"
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
        CREATE SCHEMA IF NOT EXISTS $schema_name;
EOSQL
}

create_service_user() {
    local username=$1
    local password=$2
    echo "Creating service user: $username"
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
        DO \$\$
        BEGIN
            IF NOT EXISTS (SELECT FROM pg_user WHERE usename = '$username') THEN
                CREATE USER $username WITH PASSWORD '$password';
            END IF;
        END
        \$\$;
EOSQL
}

grant_schema_privileges() {
    local schema_name=$1
    local username=$2
    local privileges=$3
    echo "Granting $privileges privileges on schema $schema_name to $username"
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
        -- Grant basic schema privileges
        GRANT USAGE ON SCHEMA $schema_name TO $username;
        GRANT CREATE ON SCHEMA $schema_name TO $username;
        
        -- Grant table privileges
        GRANT $privileges ON ALL TABLES IN SCHEMA $schema_name TO $username;
        GRANT $privileges ON ALL SEQUENCES IN SCHEMA $schema_name TO $username;
        
        -- Set default privileges for future tables and sequences
        ALTER DEFAULT PRIVILEGES IN SCHEMA $schema_name 
        GRANT $privileges ON TABLES TO $username;
        
        ALTER DEFAULT PRIVILEGES IN SCHEMA $schema_name 
        GRANT $privileges ON SEQUENCES TO $username;
EOSQL
}

grant_public_privileges() {
    local username=$1
    echo "Granting public schema privileges to $username"
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
        GRANT USAGE, CREATE ON SCHEMA public TO $username;
        GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $username;
        GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $username;
        ALTER DEFAULT PRIVILEGES IN SCHEMA public 
        GRANT ALL PRIVILEGES ON TABLES TO $username;
        ALTER DEFAULT PRIVILEGES IN SCHEMA public 
        GRANT ALL PRIVILEGES ON SEQUENCES TO $username;
EOSQL
}

set_search_path() {
    local username=$1
    local search_path=$2
    echo "Setting search path for $username to $search_path"
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
        ALTER ROLE $username SET search_path TO $search_path;
EOSQL
}

echo "Starting database initialization..."

create_schema "auth"
create_schema "chat"
create_schema "game"

create_service_user "$AUTH_DB_USER" "$AUTH_DB_PASSWORD"
create_service_user "$CHAT_DB_USER" "$CHAT_DB_PASSWORD"
create_service_user "$GAME_DB_USER" "$GAME_DB_PASSWORD"

grant_schema_privileges "auth" "$AUTH_DB_USER" "ALL PRIVILEGES"

grant_schema_privileges "chat" "$CHAT_DB_USER" "ALL PRIVILEGES"

grant_schema_privileges "game" "$GAME_DB_USER" "ALL PRIVILEGES"

# Grant read access to auth schema for game service
echo "Granting read access to auth schema for game service"
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    GRANT USAGE ON SCHEMA auth TO $GAME_DB_USER;
    GRANT SELECT, REFERENCES ON ALL TABLES IN SCHEMA auth TO $GAME_DB_USER;
    GRANT SELECT, USAGE ON ALL SEQUENCES IN SCHEMA auth TO $GAME_DB_USER;
    
    -- Set default privileges for future objects in auth schema
    ALTER DEFAULT PRIVILEGES FOR USER $AUTH_DB_USER IN SCHEMA auth 
    GRANT SELECT, REFERENCES ON TABLES TO $GAME_DB_USER;
    
    ALTER DEFAULT PRIVILEGES FOR USER $AUTH_DB_USER IN SCHEMA auth 
    GRANT SELECT, USAGE ON SEQUENCES TO $GAME_DB_USER;
EOSQL

grant_public_privileges "$AUTH_DB_USER"
grant_public_privileges "$CHAT_DB_USER"
grant_public_privileges "$GAME_DB_USER"

set_search_path "$AUTH_DB_USER" "auth,public"
set_search_path "$CHAT_DB_USER" "chat,public"
set_search_path "$GAME_DB_USER" "game,auth,public"

echo "Database initialization completed successfully!"

echo "Verifying permissions..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Verify schema existence
    SELECT nspname FROM pg_namespace WHERE nspname IN ('auth', 'chat', 'game');
    
    -- Verify user existence
    SELECT usename FROM pg_user WHERE usename IN ('$AUTH_DB_USER', '$CHAT_DB_USER', '$GAME_DB_USER');
    
    -- Verify schema privileges
    SELECT grantee, table_schema, privilege_type 
    FROM information_schema.role_table_grants 
    WHERE grantee IN ('$AUTH_DB_USER', '$CHAT_DB_USER', '$GAME_DB_USER')
    ORDER BY grantee, table_schema, privilege_type;
EOSQL