# Implementation Plan: MVP Completion

**Date:** 2026-05-07  
**Source:** docs/status-and-roadmap.md issues 001–008  
**Scope:** All items required for MVP Done checklist (issues 009–010 are Phase 10, out of scope)

---

## Technical Solution

Work in five sequential batches following the dependency order in the roadmap. Each batch ends with a test run and code review before proceeding. Issues 009–010 (LLM generator, Monaco editor) are excluded as Phase 10 enhancements.

---

## Batch 1: ISSUE-001 + ISSUE-007 — Fix OAuth Flow & Env Var Names

### Problem
- `GET /auth/google/callback` returns JSON; Angular `CallbackComponent` expects `?access_token=<token>` in redirect URL → login always fails.
- `auth.service.ts` reads `GOOGLE_OAUTH_EXCHANGE_CODE`; `railway.toml` documents `GOOGLE_OAUTH_EXCHANGE_ENABLED` → env var name inconsistency.

### Implementation Steps

**Step 1.1 — `backend/src/auth.service.ts`**
- Change `handleOAuthCallback` return type to `Promise<string>` (returns access token directly).
- Remove the `GOOGLE_OAUTH_EXCHANGE_CODE` gate; always attempt exchange when `GOOGLE_CLIENT_SECRET` is present.
- If `GOOGLE_CLIENT_SECRET` absent, throw `InternalServerErrorException('GOOGLE_CLIENT_SECRET is required for token exchange')`.
- Return `tokenData.access_token` on success.

**Step 1.2 — `backend/src/auth.controller.ts`**
- Inject Express `Response` via `@Res()`.
- Read `FRONTEND_URL` from `process.env` with default `http://localhost:4200`.
- On success: `response.redirect(`${frontendUrl}/callback?access_token=${token}`)`.
- On missing code: redirect to `${frontendUrl}/callback?error=no_code`.
- On exchange error: redirect to `${frontendUrl}/callback?error=exchange_failed`.

**Step 1.3 — `backend/.env.example`**
- Add `FRONTEND_URL=http://localhost:4200`.
- Update `GOOGLE_OAUTH_EXCHANGE_CODE` comment or remove the variable (no longer a feature flag).

**Step 1.4 — `railway.toml` and deploy docs**
- Standardize all references to `GOOGLE_OAUTH_EXCHANGE_CODE`; add `FRONTEND_URL` entry.

**Step 1.5 — Unit test: `backend/test/auth.controller.spec.ts`** (new)
- Mock `AuthService.handleOAuthCallback` to return a token string.
- Verify redirect URL contains `access_token=`.
- Verify redirect to `?error=no_code` when code absent.

### Key Files
| File | Op | Change |
|------|----|--------|
| `backend/src/auth.service.ts` | Modify | Always exchange; return `access_token` string |
| `backend/src/auth.controller.ts` | Modify | Redirect to frontend with token |
| `backend/.env.example` | Modify | Add FRONTEND_URL |
| `railway.toml` | Modify | Standardize env var docs |
| `backend/test/auth.controller.spec.ts` | Create | Redirect URL unit tests |

---

## Batch 2: ISSUE-002 + ISSUE-003 — Rate Limiting & CSRF State

### Problem
- `ThrottlerModule` configured but no guard applied → rate limiting completely inactive.
- OAuth `state='poc-login'` hardcoded → any site can forge a callback.

### Implementation Steps

**Step 2.1 — `backend/src/app.module.ts`**
- Import `APP_GUARD` from `@nestjs/core`, `ThrottlerGuard` from `@nestjs/throttler`.
- Add `{ provide: APP_GUARD, useClass: ThrottlerGuard }` to `providers` array.

**Step 2.2 — `backend/src/app.controller.ts`**
- Import `SkipThrottle` from `@nestjs/throttler`.
- Decorate `health()` with `@SkipThrottle()`.

**Step 2.3 — `backend/src/auth.service.ts`** (continuation of Batch 1)
- Add private `stateStore = new Map<string, number>()` (state → expiry epoch ms).
- In `buildGoogleAuthorizationUrl()`: generate `crypto.randomUUID()` as state; store with `Date.now() + 5 * 60_000`; prune expired entries on each call.
- In `handleOAuthCallback()`: validate state exists in store and `Date.now() < expiry`; delete entry after use; throw `BadRequestException('Invalid or expired OAuth state')` on failure.

**Step 2.4 — `backend/src/auth.controller.ts`** (continuation)
- Catch `BadRequestException` from state validation; redirect to `${frontendUrl}/callback?error=invalid_state`.

**Step 2.5 — Tests**
- `backend/test/app.module.spec.ts`: verify `APP_GUARD` with `ThrottlerGuard` is in providers.
- `backend/test/auth.service.spec.ts`: state uniqueness across two calls; expired state rejection (mock `Date.now`); valid-state acceptance and cleanup.

### Key Files
| File | Op | Change |
|------|----|--------|
| `backend/src/app.module.ts` | Modify | Register ThrottlerGuard as APP_GUARD |
| `backend/src/app.controller.ts` | Modify | @SkipThrottle() on /health |
| `backend/src/auth.service.ts` | Modify | Random state + in-memory CSRF store |
| `backend/src/auth.controller.ts` | Modify | Handle BadRequestException → error redirect |
| `backend/test/app.module.spec.ts` | Create | Guard registration test |
| `backend/test/auth.service.spec.ts` | Create | CSRF state unit tests |

---

## Batch 3: ISSUE-004 + ISSUE-005 — Media Mapping & FormSettings

### Problem
- `media` field silently ignored in mapper; `audio` type allowed in schema but unsupported by Google Forms.
- `settings` block (`collectEmails`, `limitOneResponse`, `shuffleQuestions`) validated but never sent to API.

### Implementation Steps

**Step 3.1 — `dsl/schema/form.v1.schema.json`**
- Change `media.type` enum from `["image", "video", "audio"]` to `["image", "video"]`.

**Step 3.2 — `backend/src/forms/dsl-types.ts`**
- Change `MediaType` from `'image' | 'video' | 'audio'` to `'image' | 'video'`.

**Step 3.3 — `backend/src/forms/mapper.service.ts`**
- Extend `GoogleFormsRequest` union to include `imageItem` and `videoItem` item shapes.
- In `mapDslToGoogleRequests()`: after emitting a question's `createItem`, if `question.media` is set, emit an additional `createItem`:
  - `image` → `imageItem: { image: { sourceUri: media.url } }`
  - `video` → `videoItem: { video: { youtubeUri: media.url } }`
- Increment `itemIndex` for each media item.

**Step 3.4 — `backend/src/forms/google-forms.service.ts`**
- Add `patchFormSettings(accessToken: string, formId: string, settings: FormSettings): Promise<void>`.
- Call `forms.forms.patch` with appropriate `updateMask` fields.
- Document Google Forms API field mapping in a single-line comment (some settings may not be directly patchable — skip gracefully with `Logger.warn`).

**Step 3.5 — `backend/src/forms/forms.controller.ts`**
- After `batchUpdate`, call `await this.googleForms.patchFormSettings(accessToken, formId, form.settings)`.

**Step 3.6 — Tests**
- `mapper.service.spec.ts`: add image question test (imageItem in output), video question test (videoItem in output).
- `dsl-validator.service.spec.ts`: test that `media.type: "audio"` fails validation.
- `google-forms.service.spec.ts` (new): mock `google.forms`, verify `patchFormSettings` calls `forms.patch` with correct args.

### Key Files
| File | Op | Change |
|------|----|--------|
| `dsl/schema/form.v1.schema.json` | Modify | Remove audio from enum |
| `backend/src/forms/dsl-types.ts` | Modify | Remove audio from MediaType |
| `backend/src/forms/mapper.service.ts` | Modify | Emit imageItem/videoItem after questions |
| `backend/src/forms/google-forms.service.ts` | Modify | Add patchFormSettings |
| `backend/src/forms/forms.controller.ts` | Modify | Call patchFormSettings after batchUpdate |
| `backend/src/forms/mapper.service.spec.ts` | Modify | Add media tests |
| `backend/src/forms/dsl-validator.service.spec.ts` | Modify | Audio rejection test |
| `backend/src/forms/google-forms.service.spec.ts` | Create | patchFormSettings mock test |

---

## Batch 4: ISSUE-006 — CLI Tool

### Problem
- `cli/src/index.ts` is a stub: resolves path, prints it, does nothing else.

### Implementation Steps

**Step 4.1 — `cli/src/index.ts`** (full rewrite)

Argument parsing (no external library; plain `process.argv`):
- `--help` / `-h` / no args → `printHelp()`, exit 0
- `--backend-url <url>` → override default `http://localhost:3000`
- `--token <token>` → Google access token (fallback: `GOOGLE_ACCESS_TOKEN` env var)
- `--dry-run` → stop after validation

Execution flow:
1. Read file at resolved path via `fs/promises.readFile`; on `ENOENT` print error, exit 1.
2. `JSON.parse`; on `SyntaxError` print error, exit 1.
3. `POST ${BACKEND_URL}/forms/validate` with payload.
   - Network error → print, exit 1.
   - `valid: false` → print each error, exit 1.
   - `valid: true` → print `✓ Valid DSL`.
4. If `--dry-run`, exit 0.
5. Require token; if absent, print message, exit 1.
6. `POST ${BACKEND_URL}/forms/create` with `Authorization: Bearer <token>`.
   - Success → print `formUrl`, exit 0.
   - Error → print message, exit 1.

**Step 4.2 — `cli/package.json`**
- Add `"bin": { "create-form": "dist/index.js" }`.

**Step 4.3 — `cli/src/index.spec.ts`** (full rewrite)
- Mock `fetch` with `jest.spyOn(global, 'fetch')`.
- Mock `fs/promises` for file read.
- Tests: no args → help + exit 0; missing file → exit 1; invalid JSON → exit 1; validation fail → exit 1 + errors printed; valid + dry-run → exit 0 without create call; no token → exit 1; happy path → prints formUrl + exit 0.

### Key Files
| File | Op | Change |
|------|----|--------|
| `cli/src/index.ts` | Rewrite | Full implementation |
| `cli/package.json` | Modify | Add bin entry |
| `cli/src/index.spec.ts` | Rewrite | Comprehensive tests |

---

## Batch 5: ISSUE-008 — Frontend Tests

### Problem
- Frontend has only a single stub test (`expect(true).toBe(true)` in app.component.spec.ts).
- No tests for `FormsService`, `EditorComponent`, or `CallbackComponent`.

### Implementation Steps

**Step 5.1 — `frontend/src/app/services/forms.service.spec.ts`** (new)
- `TestBed` + `HttpClientTestingModule` + `HttpTestingController`.
- `validate()`: verify POST to `/forms/validate`, correct body, returns response.
- `createForm()`: verify POST to `/forms/create`, `Authorization: Bearer <token>` header set.

**Step 5.2 — `frontend/src/app/callback/callback.component.spec.ts`** (new)
- Stub `ActivatedRoute` with `queryParamMap` as `BehaviorSubject`.
- Mock `Router.navigate`.
- Test: `access_token` present → `sessionStorage.setItem` called + navigate to `/editor`.
- Test: `code` present, no token → "Check backend configuration" message.
- Test: neither → "Authentication failed" message.

**Step 5.3 — `frontend/src/app/editor/editor.component.spec.ts`** (new)
- Provide mock `FormsService` with `validate` and `createForm` returning `of(...)`.
- Test state: idle → validating → idle on valid response; error list shown on invalid.
- Test `create()`: reads token from `sessionStorage`; error shown when absent.
- Test `create()` success: `formUrl` set in component.

**Step 5.4 — `frontend/src/app/app.component.spec.ts`** (replace stub)
- Basic smoke: component creates without error.

### Key Files
| File | Op | Change |
|------|----|--------|
| `frontend/src/app/services/forms.service.spec.ts` | Create | HTTP mock tests |
| `frontend/src/app/callback/callback.component.spec.ts` | Create | Callback state tests |
| `frontend/src/app/editor/editor.component.spec.ts` | Create | Editor flow tests |
| `frontend/src/app/app.component.spec.ts` | Modify | Replace stub test |

---

## Execution Order

```
Batch 1 → npm test -w backend → code-review →
Batch 2 → npm test -w backend → code-review →
Batch 3 → npm test -w backend → code-review →
Batch 4 → npm test -w cli    → code-review →
Batch 5 → npm test -w frontend → code-review →
MVP Done checklist verification
```

---

## MVP Done Checklist (from roadmap §8)

- [ ] Login → callback → editor navigation works in browser
- [ ] Paste valid DSL → Create Form → Google Form URL appears
- [ ] `create-form form.json --token <token>` prints Google Form URL
- [ ] `POST /forms/validate` rejects invalid payloads with actionable errors
- [ ] Rate limiting active (HTTP 429 after 30 req/60s)
- [ ] Docker container builds and starts correctly
- [ ] `npm run test` passes with >0 meaningful assertions in all workspaces

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Google Forms API `forms.patch` field names differ from DSL | Graceful skip + `Logger.warn`; tested with mock |
| Angular `TestBed` requires careful provider setup | Mirror existing `app.component.spec.ts` pattern |
| CLI `fetch` availability | Node ≥ 20 required (engines field already set) |
| State store grows unbounded in long-running process | Prune expired entries on each `buildGoogleAuthorizationUrl()` call |
