#!/usr/bin/env bash
set -euo pipefail

: "${PORT:=8080}"
: "${BACKEND_PORT:=3000}"

envsubst '${PORT} ${BACKEND_PORT}' \
  < /app/deploy/nginx/default.conf.template \
  > /etc/nginx/conf.d/default.conf

export BACKEND_PORT
node /app/backend/dist/main.js &
backend_pid=$!

cleanup() {
  kill "$backend_pid" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

# Wait for backend to become healthy before starting nginx
echo "Waiting for backend on port ${BACKEND_PORT}..."
for i in $(seq 1 30); do
  if curl -sf "http://127.0.0.1:${BACKEND_PORT}/health" > /dev/null 2>&1; then
    echo "Backend is ready."
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "Backend did not become ready in time. Exiting." >&2
    exit 1
  fi
  sleep 1
done

nginx -g 'daemon off;'
