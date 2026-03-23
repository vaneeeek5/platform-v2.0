#!/bin/bash
set -e
echo "=== Deploying STAGING ==="
git pull origin main
docker-compose -f docker-compose.yml -f docker-compose.staging.yml \
  --env-file .env.staging \
  up -d --build app-staging worker-staging
sleep 5
echo "=== Staging deployed on :3001 ==="
