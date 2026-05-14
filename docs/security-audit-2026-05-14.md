# Security & Code Audit — Formulino

**Date**: 2026-05-14  
**Reviewer**: Claude Code  
**Scope**: Full codebase pre-public-release  
**Branch**: main

---

## Summary

No hardcoded secrets in committed code, no SQL injection surface, no RCE vectors in production runtime. Eight issues identified ranging from HIGH to LOW. All are fixable before go-live.

---

## CRITICAL

None.

---

## HIGH

### H1 — OAuth access token leaked via URL query parameter
**File**: `backend/src/auth.controller.ts:31`  
**Status**: OPEN

```ts
return res.redirect(`${frontendUrl}/callback?access_token=${token}`);
```

Passing the Google access token as a URL query param means it appears in:
- Nginx/server access logs
- Browser history
- `Referer` headers sent to third-party resources (Ko-fi widget, Google APIs)
- Any browser extension with tab access

**Fix**: Use a URL fragment (`#access_token=…`) — fragments are never sent to servers or logged.

```ts
// auth.controller.ts
return res.redirect(`${frontendUrl}/callback#access_token=${token}`);
```

```ts
// callback.component.ts — read from hash instead of queryParamMap
const hash = new URLSearchParams(window.location.hash.slice(1));
const token = hash.get('access_token');
```

---

### H2 — npm audit: 8 high-severity vulnerabilities (root), 1 high (backend)
**File**: `package.json`, `backend/package.json`  
**Status**: OPEN

```
serialize-javascript <=7.0.4    → RCE via RegExp/Date (build pipeline)
tar <=7.5.10                    → Path traversal / arbitrary file write (build pipeline)
fast-uri <=3.1.1                → Path traversal (also in backend runtime)
@babel/plugin-transform-modules-systemjs → Arbitrary code on malicious input
ip-address <=10.1.0             → XSS in HTML methods
postcss <8.5.10                 → XSS via unescaped </style>
```

**Fix**:
```bash
npm audit fix          # root
cd backend && npm audit fix    # backend (fast-uri)
```

`tar` fix requires `npm audit fix --force` (Angular CLI major bump) — assess separately.

---

## MEDIUM

### M1 — In-memory OAuth state store: restart/multi-instance unsafe
**File**: `backend/src/auth.service.ts:18`  
**Status**: OPEN (accepted for single-instance)

```ts
private readonly stateStore = new Map<string, number>();
```

State lost on restart; breaks in multi-replica deployments.  
Acceptable for single-instance hobby deploy — documented here as known limitation.

---

### M2 — No Content-Security-Policy header
**File**: `deploy/nginx/default.conf.template`  
**Status**: OPEN

Nginx has `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` — but no CSP.  
Without CSP, any XSS has full DOM access.

---

### M3 — Media URL not validated; SSRF-adjacent risk
**File**: `backend/src/forms/mapper.service.ts:136-152`  
**Status**: OPEN

User-supplied `media.url` is forwarded verbatim to Google Forms API (`sourceUri`, `youtubeUri`) without schema validation.

**Fix**: Enforce `https://` in the DSL JSON schema.

---

### M4 — Swagger UI exposed in production
**File**: `backend/src/main.ts:21-22`  
**Status**: OPEN

```ts
SwaggerModule.setup('api/docs', app, document);  // enabled unconditionally
```

---

### M5 — Privacy policy inaccurate re: token storage & URL exposure
**File**: `frontend/src/app/privacy/privacy.component.ts`  
**Status**: OPEN

Policy does not disclose that the token passes through a URL query param (server logs) or that it is stored in `sessionStorage`.

---

## LOW

### L1 — `atob` base64 fallback increases input attack surface
**File**: `frontend/src/app/app.component.ts:808-810`  
**Status**: OPEN

```ts
return JSON.parse(atob(cleaned));
```

Silent base64 decode accepts unexpected inputs. Remove the fallback.

---

### L2 — Throttle too loose for `/forms/create`
**File**: `backend/src/app.module.ts:12`  
**Status**: OPEN

30 req/60s globally. `/forms/create` hits Google API quota. Add per-route tighter limit.

---

### L3 — Nginx `add_header` inheritance: security headers missing from static assets
**File**: `deploy/nginx/default.conf.template:19-23`  
**Status**: OPEN

`add_header` in a child `location` block replaces parent-level headers. Security headers are not sent with JS/CSS/image responses.

---

### L4 — Missing `Permissions-Policy` header
**File**: `deploy/nginx/default.conf.template`  
**Status**: OPEN

---

## Validation Results

| Check | Result | Notes |
|---|---|---|
| Root `npm audit` | FAIL | 8 high, 2 moderate — build-time deps |
| Backend `npm audit` | FAIL | 1 high — `fast-uri` runtime dep |
| Secrets in git history | PASS | `.env` never committed |
| Hardcoded secrets in source | PASS | All via `process.env` |
| SQL injection | N/A | No database |
| XSS | PASS (caveat) | Angular sanitises; no raw HTML injection |
| CSRF | PARTIAL | OAuth state param OK; API is Bearer-only |
| Input validation | PASS | AJV schema on all payloads |
| Auth bypass | PASS | Bearer required on create endpoint |

---

## Fix Priority

| # | Issue | Effort | Impact | Status |
|---|---|---|---|---|
| 1 | H1 — Token in URL → use fragment | Low | High | FIXED |
| 2 | H2 — `npm audit fix` | Low | High | FIXED |
| 3 | L3 — Nginx header inheritance bug | Low | Medium | FIXED |
| 4 | M2 — Add CSP header | Low | Medium | FIXED |
| 5 | M4 — Disable Swagger in production | Low | Low | FIXED |
| 6 | M3 — URL pattern in DSL schema | Low | Medium | FIXED |
| 7 | L2 — Tighten throttle on create endpoint | Low | Medium | FIXED |
| 8 | M5 — Update privacy policy | Low | Legal | FIXED |
| 9 | L1 — Remove `atob` fallback | Low | Low | FIXED |
| 10 | L4 — Add Permissions-Policy header | Low | Low | FIXED |
