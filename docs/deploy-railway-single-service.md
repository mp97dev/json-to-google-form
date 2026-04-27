# Deploy Guide: Railway Single Service (Frontend + Backend)

Questa guida usa un approccio moderno e supportato da Railway: `railway.toml` + Dockerfile.
Obiettivo: pubblicare frontend Angular e backend NestJS come un solo servizio Railway.

## 1) Cosa e stato cambiato nel codice

Questi file implementano il deploy single-service:

- `railway.toml`: build via Dockerfile + healthcheck
- `Dockerfile`: build multi-stage per frontend e backend
- `deploy/nginx/default.conf.template`: Nginx serve frontend e fa proxy API
- `deploy/start.sh`: avvio backend interno + Nginx in foreground
- `frontend/src/environments/environment.production.ts`: frontend usa `apiBaseUrl: '/api'`
- `frontend/angular.json`: file replacement per usare environment production in build

### Routing runtime

- Traffico pubblico: porta Railway (`PORT`) su Nginx
- Frontend statico: `/`
- API backend: `/api/*` -> `http://127.0.0.1:3000/*`
- Healthcheck Railway: `/health` -> backend `/health`

## 2) Prerequisiti

- Repository pushato su GitHub
- Progetto Railway creato
- Google Cloud project con OAuth 2.0 Client ID
- Google Forms API abilitata

## 3) Setup Google Cloud (OAuth)

1. Apri Google Cloud Console e seleziona il project.
2. In "APIs & Services" abilita "Google Forms API".
3. Configura "OAuth consent screen".
4. Crea un OAuth Client ID di tipo Web application.
5. Aggiungi tra le Authorized redirect URIs:
   - `https://<RAILWAY_DOMAIN>/api/auth/google/callback`

Nota: su Railway, con reverse proxy Nginx, il callback pubblico include il prefisso `/api`.

## 4) Configurazione variabili in Railway

In Railway, nel servizio, vai su Variables e imposta:

### Obbligatorie

- `GOOGLE_CLIENT_ID`: client ID OAuth Google
- `GOOGLE_REDIRECT_URI`: `https://<RAILWAY_DOMAIN>/api/auth/google/callback`

### Opzionali / consigliate

- `GOOGLE_CLIENT_SECRET`: necessario se vuoi scambiare il code con token lato backend
- `GOOGLE_OAUTH_EXCHANGE_CODE=true`: abilita token exchange nel callback
- `CORS_ORIGIN=https://<RAILWAY_DOMAIN>`: fallback sicuro per CORS lato backend

Non impostare `PORT` manualmente: Railway la inietta automaticamente.

## 5) Deploy step by step su Railway

1. Crea un nuovo progetto Railway.
2. Seleziona "Deploy from GitHub repo".
3. Collega questo repository.
4. Verifica che Railway rilevi `railway.toml` e `Dockerfile` alla root.
5. Imposta le Variables del punto 4.
6. Fai deploy.
7. A deploy completato, apri il dominio pubblico Railway.

## 6) Verifiche post-deploy

Esegui questi check:

1. `GET https://<RAILWAY_DOMAIN>/health` restituisce `{"service":"backend","status":"ok"}`.
2. Apri la homepage `https://<RAILWAY_DOMAIN>/`.
3. Click su "Login with Google".
4. Verifica redirect verso Google e ritorno su `/api/auth/google/callback`.

## 7) Test locale del container (consigliato)

Build:

```bash
docker build -t json-to-google-form:railway .
```

Run:

```bash
docker run --rm -p 8080:8080 \
  -e GOOGLE_CLIENT_ID="<id>" \
  -e GOOGLE_REDIRECT_URI="http://localhost:8080/api/auth/google/callback" \
  json-to-google-form:railway
```

Check:

- Frontend: `http://localhost:8080/`
- Health: `http://localhost:8080/health`
- OAuth login: `http://localhost:8080/api/auth/google/login`

## 8) Aggiornamenti consigliati ai file .env.example

Per allineamento con deploy Railway single-service, usa questi valori esempio:

`backend/.env.example`

```env
PORT=3000
NODE_ENV=development
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
GOOGLE_OAUTH_EXCHANGE_CODE=false
CORS_ORIGIN=http://localhost:4200
```

Per produzione Railway, sovrascrivi:

- `GOOGLE_REDIRECT_URI=https://<RAILWAY_DOMAIN>/api/auth/google/callback`
- `CORS_ORIGIN=https://<RAILWAY_DOMAIN>`

`frontend/.env.example` non e usato direttamente nel build Angular attuale (la base URL e gestita dagli environment TypeScript).

## 9) Troubleshooting rapido

- Errore avvio `deploy/start.sh` in host locale:
  - Lo script richiede Nginx installato. Usare sempre Docker per test locale del deploy.
- Build frontend fallisce in CI/deploy:
  - Verifica che esista `frontend/src/environments/environment.production.ts`.
  - Verifica `fileReplacements` in `frontend/angular.json`.
- OAuth callback mismatch:
  - URI in Google Cloud deve essere identica a `GOOGLE_REDIRECT_URI`.
  - Con questa architettura deve includere `/api/auth/google/callback`.
