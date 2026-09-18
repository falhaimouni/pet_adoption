#!/usr/bin/env bash

set -euo pipefail

umask 077

BACKUP_DIR="/backups/uploads"
SOURCE_DIR="/uploads"

RETENTION_DAYS="$(cat /run/backup/retention_days)"

mkdir -p "$BACKUP_DIR"

TIMESTAMP="$(date +%Y%m%d_%H%M%S)"

BACKUP_FILE="${BACKUP_DIR}/backend_uploads_${TIMESTAMP}.tar.gz"
TEMP_FILE="${BACKUP_FILE}.tmp"

echo "[$(date)] Starting backend uploads backup..."

trap 'rm -f "$TEMP_FILE"' ERR

tar -czf "$TEMP_FILE" -C "$SOURCE_DIR" .

if [ ! -s "$TEMP_FILE" ]; then
    echo "[$(date)] ERROR: uploads backup file is empty."
    rm -f "$TEMP_FILE"
    exit 1
fi

mv "$TEMP_FILE" "$BACKUP_FILE"

chmod 600 "$BACKUP_FILE"

# Make the resulting file use the same ownership as the host backup folder.
BACKUP_OWNER="$(stat -c '%u:%g' "$BACKUP_DIR")"
chown "$BACKUP_OWNER" "$BACKUP_FILE" || true

echo "[$(date)] Uploads backup created: $BACKUP_FILE"

find "$BACKUP_DIR" \
    -type f \
    -name 'backend_uploads_*.tar.gz' \
    -mtime +"$RETENTION_DAYS" \
    -delete

echo "[$(date)] Uploads backup completed successfully."