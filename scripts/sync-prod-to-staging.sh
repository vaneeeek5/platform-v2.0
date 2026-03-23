#!/bin/bash
set -e
echo "=== Syncing PROD → STAGING ==="
docker exec platform-db pg_dump \
  -U nextjs marketing_platform \
  --no-owner --no-acl > /tmp/prod_dump.sql
docker exec -i platform-db-staging psql \
  -U nextjs marketing_platform_staging < /tmp/prod_dump.sql
rm /tmp/prod_dump.sql
docker exec platform-redis redis-cli -n 1 FLUSHDB
echo "=== Done. Staging now has prod data ==="
