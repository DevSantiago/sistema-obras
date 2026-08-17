FROM postgres:17-bookworm

RUN apt-get update \
  && apt-get install -y --no-install-recommends awscli ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY deploy/backup-postgres.sh /usr/local/bin/backup-postgres

ENTRYPOINT ["/usr/local/bin/backup-postgres"]
