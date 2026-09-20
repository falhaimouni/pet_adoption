FROM postgres:15

RUN apt-get update \
    && apt-get install -y --no-install-recommends cron \
    && rm -rf /var/lib/apt/lists/*

COPY backup-db.sh /usr/local/bin/backup-db.sh
COPY backup-uploads.sh /usr/local/bin/backup-uploads.sh
COPY restore-db.sh /usr/local/bin/restore-db.sh
COPY entrypoint.sh /usr/local/bin/backup-entrypoint.sh

RUN chmod +x \
    /usr/local/bin/backup-db.sh \
    /usr/local/bin/backup-uploads.sh \
    /usr/local/bin/restore-db.sh \
    /usr/local/bin/backup-entrypoint.sh

ENTRYPOINT ["/usr/local/bin/backup-entrypoint.sh"]