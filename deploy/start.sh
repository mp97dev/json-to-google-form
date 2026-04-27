#!/usr/bin/env bash
set -euo pipefail

: "${PORT:=8080}"
: "${BACKEND_PORT:=3000}"

envsubst '${PORT}' \
  < /app/deploy/nginx/default.conf.template \
  > /etc/nginx/conf.d/default.conf

PORT="$BACKEND_PORT" node /app/backend/dist/main.js &
backend_pid=$!

cleanup() {
  kill "$backend_pid" 2>/dev/null || true
}

trap cleanup EXIT INT TERM

nginx -g 'daemon off;'
