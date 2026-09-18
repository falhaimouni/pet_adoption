#!/usr/bin/env bash

set -euo pipefail


: "${POSTGRES_USER:?POSTGRES_USER is required}"
: "${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is required}"
: "${POSTGRES_DB:?POSTGRES_DB is required}"

TZ="${TZ:-UTC}"
BACKUP_SCHEDULE="${BACKUP_SCHEDULE:-0 2 * * *}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"

echo "Backup timezone: $TZ"
echo "Backup schedule: $BACKUP_SCHEDULE"
echo "Backup retention: $RETENTION_DAYS days"

# Configure container timezone.
if [ -f "/usr/share/zoneinfo/$TZ" ]; then
    ln -snf "/usr/share/zoneinfo/$TZ" /etc/localtime
    echo "$TZ" > /etc/timezone
else
    echo "ERROR: Unknown timezone: $TZ"
    exit 1
fi

mkdir -p /run/backup
mkdir -p /backups

printf '%s' "$POSTGRES_USER" > /run/backup/db_user
printf '%s' "$POSTGRES_DB" > /run/backup/db_name
printf '%s' "$RETENTION_DAYS" > /run/backup/retention_days

# Escape characters that have special meaning in .pgpass.
ESCAPED_USER="$(printf '%s' "$POSTGRES_USER" | sed 's/\\/\\\\/g; s/:/\\:/g')"
ESCAPED_PASSWORD="$(printf '%s' "$POSTGRES_PASSWORD" | sed 's/\\/\\\\/g; s/:/\\:/g')"

printf 'postgres:5432:*:%s:%s\n' \
    "$ESCAPED_USER" \
    "$ESCAPED_PASSWORD" \
    > /run/backup/pgpass

chmod 600 /run/backup/pgpass

# Generate cron configuration.
printf '%s root /usr/local/bin/backup-db.sh >> /proc/1/fd/1 2>> /proc/1/fd/2\n' \
    "$BACKUP_SCHEDULE" \
    > /etc/cron.d/db-backup

printf '%s root /usr/local/bin/backup-uploads.sh >> /proc/1/fd/1 2>> /proc/1/fd/2\n' \
    "$BACKUP_SCHEDULE" \
    >> /etc/cron.d/db-backup

chmod 0644 /etc/cron.d/db-backup

echo "Backup scheduler started."

exec cron -f