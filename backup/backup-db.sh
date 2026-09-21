#!/usr/bin/env bash

set -euo pipefail

umask 077

BACKUP_DIR="/backups"

DB_USER="$(cat /run/backup/db_user)"
DB_NAME="$(cat /run/backup/db_name)"
RETENTION_DAYS="$(cat /run/backup/retention_days)"

TIMESTAMP="$(date +%Y%m%d_%H%M%S)"

BACKUP_FILE="${BACKUP_DIR}/pet_adoption_${TIMESTAMP}.dump"
TEMP_FILE="${BACKUP_FILE}.tmp"

echo "[$(date)] Starting PostgreSQL backup..."

trap 'rm -f "$TEMP_FILE"' ERR

PGPASSFILE=/run/backup/pgpass \
pg_dump \
    -h postgres \
    -p 5432 \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --format=custom \
    -f "$TEMP_FILE"

if [ ! -s "$TEMP_FILE" ]; then
    echo "[$(date)] ERROR: backup file is empty."
    rm -f "$TEMP_FILE"
    exit 1
fi

mv "$TEMP_FILE" "$BACKUP_FILE"

chmod 600 "$BACKUP_FILE"

# Make the resulting file use the same ownership as the host backup folder.
BACKUP_OWNER="$(stat -c '%u:%g' "$BACKUP_DIR")"
chown "$BACKUP_OWNER" "$BACKUP_FILE" || true

echo "[$(date)] Backup created: $BACKUP_FILE"

find "$BACKUP_DIR" \
    -type f \
    -name 'pet_adoption_*.dump' \
    -mtime +"$RETENTION_DAYS" \
    -delete

echo "[$(date)] Backup completed successfully."