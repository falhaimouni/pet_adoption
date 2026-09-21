#!/usr/bin/env bash

set -euo pipefail

BACKUP_FILE="${1:-}"

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: restore-db.sh <backup-file>"
    echo "Example: restore-db.sh pet_adoption_20260916_151641.dump"
    exit 1
fi

# Allow either a filename or a full /backups/... path.
if [[ "$BACKUP_FILE" != /* ]]; then
    BACKUP_FILE="/backups/$BACKUP_FILE"
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "ERROR: Backup file not found: $BACKUP_FILE"
    exit 1
fi

DB_USER="$(cat /run/backup/db_user)"
DB_NAME="$(cat /run/backup/db_name)"

# Verify that PostgreSQL can read the archive before touching the database.
if ! pg_restore -l "$BACKUP_FILE" >/dev/null 2>&1; then
    echo "ERROR: Invalid or unreadable PostgreSQL backup: $BACKUP_FILE"
    exit 1
fi

echo "WARNING: This will replace the current contents of database '$DB_NAME'."
read -r -p "Type RESTORE to continue: " CONFIRMATION

if [ "$CONFIRMATION" != "RESTORE" ]; then
    echo "Restore cancelled."
    exit 1
fi

echo "[$(date)] Starting database restore from: $BACKUP_FILE"

PGPASSFILE=/run/backup/pgpass \
pg_restore \
    -h postgres \
    -p 5432 \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --clean \
    --if-exists \
    --no-owner \
    --no-privileges \
    --exit-on-error \
    "$BACKUP_FILE"

echo "[$(date)] Database restore completed successfully."