# Migration Guide: Railway Public URL → formulino.ginkgo3d.it

This guide migrates Formulino from the Railway-assigned public domain
(`*.up.railway.app`) to the custom domain `formulino.ginkgo3d.it`.

The migration has zero downtime: the old domain stays active until you
explicitly remove it, and DNS + OAuth changes can be made before any Railway
variable is touched.

---

## What changes

| Setting | Before | After |
|---|---|---|
| Public URL | `https://<hash>.up.railway.app` | `https://formulino.ginkgo3d.it` |
| `GOOGLE_REDIRECT_URI` | `https://<hash>.up.railway.app/api/auth/google/callback` | `https://formulino.ginkgo3d.it/api/auth/google/callback` |
| `FRONTEND_URL` | `https://<hash>.up.railway.app` | `https://formulino.ginkgo3d.it` |
| `CORS_ORIGIN` | `https://<hash>.up.railway.app` | `https://formulino.ginkgo3d.it` |

Nothing in the codebase changes — all configuration lives in Railway environment
variables and Google Cloud Console.

---

## Step 1 — Railway: add the custom domain

1. Open [railway.app](https://railway.app) → your project → the Formulino service.
2. Go to **Settings → Networking**.
3. Click **Add Custom Domain**.
4. Enter `formulino.ginkgo3d.it` and confirm.
5. Railway displays a **CNAME target** — a string like `<hash>.up.railway.app`.
   Copy it; you need it in the next step.

> Do **not** delete the old `*.up.railway.app` domain yet — keep both active
> during the transition so existing sessions are not broken.

---

## Step 2 — DNS: create the CNAME record

Log in to the DNS provider for `ginkgo3d.it` and add:

| Type | Name | Value | TTL |
|---|---|---|---|
| `CNAME` | `formulino` | `<CNAME target from Step 1>` | `300` |

Set TTL to 300 (5 minutes) for now so you can correct mistakes quickly.
Raise it to 3600 after everything is verified.

**Verify propagation** (takes 1–10 minutes):

```bash
dig formulino.ginkgo3d.it CNAME +short
# expected: <hash>.up.railway.app.

curl -I https://formulino.ginkgo3d.it/health
# expected: HTTP/2 200
```

Railway provisions a TLS certificate automatically once it sees DNS resolving
correctly. The Railway dashboard shows **"Certificate issued"** when it is ready
— do not proceed to Step 3 until then.

---

## Step 3 — Google Cloud Console: update OAuth credentials

Google Cloud has two separate places for domain configuration. They behave
differently and must not be confused.

### 3a — OAuth consent screen: Authorized domains

Go to **APIs & Services → OAuth consent screen → Edit App → Authorized domains**.

This field only accepts the **top private domain** — no subdomain prefix, no
`https://`, no path. Enter:

```
ginkgo3d.it
```

Entering `formulino.ginkgo3d.it` here will fail with *"must be a top private
domain"*. The root domain `ginkgo3d.it` covers all subdomains automatically.

### 3b — OAuth 2.0 Client ID: Origins and Redirect URIs

Go to **APIs & Services → Credentials** → click your OAuth 2.0 Client ID.
These fields accept full URLs including subdomains.

**Authorized JavaScript Origins** — add the new origin, keep the old one:

```
https://formulino.ginkgo3d.it
https://<hash>.up.railway.app
```

**Authorized Redirect URIs** — add the new callback, keep the old one:

```
https://formulino.ginkgo3d.it/api/auth/google/callback
https://<hash>.up.railway.app/api/auth/google/callback
```

Click **Save**. Google propagates the change within seconds.

> The old entries must stay until Railway variables are updated and redeployed —
> any active OAuth flow that started on the old domain would break otherwise.

---

## Step 4 — Railway: update environment variables

In the Railway dashboard → your service → **Variables**, change these three values:

| Variable | New value |
|---|---|
| `GOOGLE_REDIRECT_URI` | `https://formulino.ginkgo3d.it/api/auth/google/callback` |
| `FRONTEND_URL` | `https://formulino.ginkgo3d.it` |
| `CORS_ORIGIN` | `https://formulino.ginkgo3d.it` |

Save — Railway redeploys automatically. The redeploy takes ~1 minute.

---

## Step 5 — Verify end-to-end

```bash
# 1. Health check on the new domain
curl https://formulino.ginkgo3d.it/health
# expected: {"service":"backend","status":"ok"}

# 2. Frontend HTML served
curl -sI https://formulino.ginkgo3d.it/ | grep -i content-type
# expected: text/html

# 3. OAuth redirect starts correctly
curl -sI https://formulino.ginkgo3d.it/api/auth/google/login | grep -i location
# expected: Location: https://accounts.google.com/o/oauth2/...
```

Then open `https://formulino.ginkgo3d.it` in a browser and complete a full
OAuth login → form creation flow to confirm everything works.

---

## Step 6 — Cleanup (wait 24–48 h after verifying)

Once you are confident the new domain is stable:

### Google Cloud Console

Remove the old entries from both lists:

- Authorized JavaScript Origins: delete `https://<hash>.up.railway.app`
- Authorized Redirect URIs: delete `https://<hash>.up.railway.app/api/auth/google/callback`

### Railway

Go to **Settings → Networking** and delete the old `*.up.railway.app` public
domain. This prevents users from bypassing the custom domain and hitting the
Railway URL directly.

### DNS

Raise the TTL on the `formulino` CNAME record from `300` to `3600`.

---

## Troubleshooting

### Railway shows "Certificate pending" for more than 10 minutes

The CNAME record is not resolving yet. Verify with `dig formulino.ginkgo3d.it CNAME`.
If the record is present, wait longer — some DNS providers have propagation delays
up to 30 minutes even with low TTL.

### `redirect_uri_mismatch` after switching

The `GOOGLE_REDIRECT_URI` variable still has the old Railway domain, or the
new URI was not saved in Google Cloud Console. Double-check both exactly match
`https://formulino.ginkgo3d.it/api/auth/google/callback` with no trailing slash.

### Old domain still works, new domain returns 502

Railway redeployed with the new variables but the backend failed to start.
Check deployment logs — a missing or malformed `GOOGLE_REDIRECT_URI` causes
`getRequiredEnv` to throw on the first request. Correct the variable and
trigger a manual redeploy from the Railway dashboard.

### CORS errors in the browser console

`CORS_ORIGIN` was not updated or the redeployment did not pick it up. Confirm
the variable value in Railway, then trigger a manual redeploy if needed.
