#!/usr/bin/env bash
set -euo pipefail

# Costruisci l'immagine Docker
IMAGE_NAME=json-to-google-form:localtest

echo "Costruzione immagine Docker..."
docker build -t $IMAGE_NAME .

echo "Avvio container sulla porta 8080 (nginx) e 3000 (backend, solo accesso interno al container)..."

docker run --rm -d \
  -p 8080:8080 \
  --name json-to-google-form-test \
  $IMAGE_NAME

# Attendi che nginx sia pronto
for i in $(seq 1 30); do
  if curl -sf "http://localhost:8080/health" > /dev/null 2>&1; then
    echo "nginx è pronto su http://localhost:8080"
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "nginx non è diventato pronto in tempo. Esci." >&2
    docker logs json-to-google-form-test || true
    docker stop json-to-google-form-test || true
    exit 1
  fi
  sleep 1
done

echo "Test endpoint root (frontend statico):"
curl -i http://localhost:8080/

echo "Test endpoint API health (proxy nginx):"
curl -i http://localhost:8080/health

echo "Test endpoint API (proxy nginx):"
curl -i http://localhost:8080/api/forms

echo "Per vedere i log in tempo reale: docker logs -f json-to-google-form-test"
echo "Per fermare il container: docker stop json-to-google-form-test"
