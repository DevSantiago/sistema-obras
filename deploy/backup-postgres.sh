#!/bin/sh
set -eu

: "${POSTGRES_HOST:?POSTGRES_HOST es obligatorio}"
: "${POSTGRES_PORT:=5432}"
: "${BACKUP_S3_BUCKET:?BACKUP_S3_BUCKET es obligatorio}"
: "${AWS_REGION:?AWS_REGION es obligatorio}"
: "${BACKUP_DIR:=/tmp/sistema-obras-backups}"

mkdir -p "$BACKUP_DIR"
fecha="$(date -u +%Y%m%dT%H%M%SZ)"

respaldar() {
  ambiente="$1"
  base="$2"
  usuario="$3"
  password="$4"
  archivo="$BACKUP_DIR/${ambiente}-${fecha}.dump"

  PGPASSWORD="$password" pg_dump \
    --host "$POSTGRES_HOST" \
    --port "$POSTGRES_PORT" \
    --username "$usuario" \
    --format custom \
    --file "$archivo" \
    "$base"

  aws s3 cp "$archivo" \
    "s3://${BACKUP_S3_BUCKET}/postgres/${ambiente}/$(basename "$archivo")" \
    --region "$AWS_REGION" \
    --sse AES256

  rm -f "$archivo"
}

respaldar "stg" "$STG_DB_NAME" "$STG_DB_USER" "$STG_DB_PASSWORD"
respaldar "prod" "$PROD_DB_NAME" "$PROD_DB_USER" "$PROD_DB_PASSWORD"
