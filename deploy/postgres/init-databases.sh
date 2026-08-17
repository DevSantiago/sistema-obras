#!/bin/sh
set -eu

crear_base() {
  usuario="$1"
  password="$2"
  base="$3"

  psql --username "$POSTGRES_USER" --dbname postgres \
    --set usuario="$usuario" \
    --set password="$password" \
    --set base="$base" <<'SQL'
SELECT format('CREATE ROLE %I LOGIN PASSWORD %L', :'usuario', :'password')
WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = :'usuario')\gexec
SELECT format('CREATE DATABASE %I OWNER %I', :'base', :'usuario')
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = :'base')\gexec
SQL
}

crear_base "$STG_DB_USER" "$STG_DB_PASSWORD" "$STG_DB_NAME"
crear_base "$PROD_DB_USER" "$PROD_DB_PASSWORD" "$PROD_DB_NAME"
