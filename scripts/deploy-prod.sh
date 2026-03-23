#!/bin/bash
set -e
echo "=== Deploying PRODUCTION ==="
git pull origin main
docker-compose --env-file .env up -d --build app worker
sleep 5
docker-compose ps
echo "=== Production deployed on :3000 ==="
