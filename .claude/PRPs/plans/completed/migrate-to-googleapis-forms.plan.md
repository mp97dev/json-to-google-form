# Plan: Migrate from `googleapis` to `@googleapis/forms`

## Summary

Replace the monolithic `googleapis` package (300+ APIs bundled) with the lightweight
per-service `@googleapis/forms` package (~264 KB unpacked vs multi-MB). The migration is
mechanical — only the import and OAuth2 client construction change; every Forms API call
remains identical. The current implementation is already aligned with Google Forms API v1
REST best practices, with one minor gap noted below.

## User Story

As a backend engineer,  
I want to depend only on the Google Forms API client (not all 300+ Google APIs),  
so that the backend stays lean, types stay narrow, and future audits are simpler.

## Problem → Solution

Current: `googleapis` v144 bundles every Google API, exposes types under namespaced
`forms_v1.*`, and pulls multi-MB into the node_modules tree.  
Desired: `@googleapis/forms` exposes only the Forms API surface (~264 KB unpacked, 14.8 KB
gzipped for v1.js), with the same method signatures and auto-generated types.

## Metadata

- **Complexity**: Small
- **Source PRD**: N/A
- **PRD Phase**: N/A
- **Estimated Files**: 2 (package.json + google-forms.service.ts)

---

## UX Design

N/A — internal change, no user-facing behaviour altered.

---

## Mandatory Reading

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 | `backend/src/forms/google-forms.service.ts` | 1-94 | Only file that uses `googleapis` — the entire migration surface |
| P1 | `backend/package.json` | all | Dependency list to update |
| P2 | `backend/src/forms/google-forms.service.spec.ts` | 1-34 | Verify tests still pass after change |

## External Documentation

| Topic | Source | Key Takeaway |
|---|---|---|
| @googleapis/forms npm | https://www.npmjs.com/package/@googleapis/forms | v6.0.1, depends on `googleapis-common ^8.0.0`, 264 KB unpacked |
| google-auth-library | https://github.com/googleapis/google-auth-library-nodejs | `OAuth2Client` exported from `google-auth-library` — required when dropping `googleapis` |
| Forms API v1 REST | https://developers.google.com/forms/api/reference/rest | `forms.batchUpdate`, `forms.create`, `updateSettings` — all used correctly |

---

## API Currency Assessment

The current implementation in `google-forms.service.ts` is **correct and up-to-date** with
Google Forms API v1:

| Feature Used | Status | Notes |
|---|---|---|
| `forms.forms.create({ requestBody: { info: { title } } })` | Correct | Only `info.title` accepted on initial create |
| `forms.forms.batchUpdate({ formId, requestBody: { requests } })` | Correct | Used for items and settings |
| `updateSettings` with `quizSettings.isQuiz` + `updateMask` | Correct | Proper field-mask pattern |
| `collectEmails` / `limitOneResponse` / `shuffleQuestions` via API | Correctly skipped | Forms API v1 REST does not expose these; warn logs are the right response |
| `grading.correctAnswers.answers` structure | Correct | Matches API spec; `isCorrect` flag removed (prior fix) |
| `itemId` omitted from `createItem` | Correct | API generates its own IDs (prior fix) |

**One gap to know about:** The Forms API added `forms.setPublishSettings` (publish/unpublish
a form) after the initial v1 release. Our DSL has no `published` field, so this endpoint is
intentionally out of scope. No action needed.

---

## Patterns to Mirror

### IMPORT_PATTERN (before)
```typescript
// SOURCE: backend/src/forms/google-forms.service.ts:2,11,24,50,69
import { google } from 'googleapis';

const client = new google.auth.OAuth2(clientId, clientSecret);
const forms = google.forms({ version: 'v1', auth });
```

### IMPORT_PATTERN (after)
```typescript
import { forms } from '@googleapis/forms';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(clientId, clientSecret);
const formsClient = forms({ version: 'v1', auth: client });
// formsClient.forms.create(...) — identical call shape
```

### SERVICE_PATTERN
```typescript
// SOURCE: backend/src/forms/google-forms.service.ts:10-17
private buildOAuth2Client(accessToken: string) {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );
  client.setCredentials({ access_token: accessToken });
  return client;
}
```
After migration: replace `new google.auth.OAuth2(...)` with `new OAuth2Client(...)`.
`setCredentials(...)` is identical — it is from `google-auth-library` in both cases.

---

## Files to Change

| File | Action | Justification |
|---|---|---|
| `backend/package.json` | UPDATE | Remove `googleapis`, add `@googleapis/forms` + `google-auth-library` |
| `backend/src/forms/google-forms.service.ts` | UPDATE | Change import and OAuth2 constructor |

## NOT Building

- Any changes to `mapper.service.ts` — it has no googleapis imports
- Any changes to `auth.service.ts` — it uses native `fetch` for token exchange, not googleapis
- Any changes to types, DSL, or controller
- New API features (setPublishSettings, watch endpoints)
- collectEmails / limitOneResponse / shuffleQuestions support (Forms API v1 does not expose them)

---

## Step-by-Step Tasks

### Task 1: Update package.json
- **ACTION**: Replace `googleapis` with `@googleapis/forms` and add `google-auth-library`
- **IMPLEMENT**:
  ```json
  // Remove:
  "googleapis": "^144.0.0"
  // Add:
  "@googleapis/forms": "^6.0.1",
  "google-auth-library": "^9.0.0"
  ```
- **MIRROR**: IMPORT_PATTERN above
- **IMPORTS**: N/A
- **GOTCHA**: `google-auth-library` is a peer dependency of `googleapis-common` (which `@googleapis/forms` depends on), so it is almost certainly already installed transitively. Adding it explicitly as a direct dep makes the intent clear and avoids future breakage if the transitive dep is pruned.
- **VALIDATE**: `npm install` completes cleanly; `node -e "require('@googleapis/forms')"` prints nothing (no error)

### Task 2: Update google-forms.service.ts imports and OAuth2 constructor
- **ACTION**: Replace the `googleapis` import with `@googleapis/forms` and `google-auth-library`
- **IMPLEMENT**:
  ```typescript
  // Old:
  import { google } from 'googleapis';
  // ...
  private buildOAuth2Client(accessToken: string) {
    const client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
    );
    client.setCredentials({ access_token: accessToken });
    return client;
  }
  // Inside createForm / batchUpdate / patchFormSettings:
  const forms = google.forms({ version: 'v1', auth });
  await forms.forms.create(...)
  await forms.forms.batchUpdate(...)

  // New:
  import { forms } from '@googleapis/forms';
  import { OAuth2Client } from 'google-auth-library';
  // ...
  private buildOAuth2Client(accessToken: string) {
    const client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
    );
    client.setCredentials({ access_token: accessToken });
    return client;
  }
  // Inside createForm / batchUpdate / patchFormSettings:
  const formsClient = forms({ version: 'v1', auth });
  await formsClient.forms.create(...)
  await formsClient.forms.batchUpdate(...)
  ```
- **MIRROR**: SERVICE_PATTERN above
- **IMPORTS**: `@googleapis/forms`, `google-auth-library`
- **GOTCHA**: The local variable `forms` would shadow the imported `forms` function — rename
  the client variable to `formsClient` (or `client`) everywhere in the service to avoid
  the name collision.
- **VALIDATE**: TypeScript compiles with zero errors (`npm run build`)

---

## Testing Strategy

### Unit Tests

| Test | Input | Expected Output | Edge Case? |
|---|---|---|---|
| existing `patchFormSettings` tests | various settings combinations | no throw | No |
| existing `GoogleFormsService` createForm/batchUpdate tests | mocked googleapis | same mocks still valid if adjusted | No |

The existing tests mock at the network/googleapis layer. After migration, any mocks that
target the `googleapis` module path will need to be updated to `@googleapis/forms`.
Check `backend/src/forms/google-forms.service.spec.ts` for `jest.mock('googleapis')` before running.

### Edge Cases Checklist
- [x] Empty `requests` array — `batchUpdate` returns early (no change, existing guard)
- [x] Missing env vars — `OAuth2Client` accepts `undefined` constructor args (same behaviour as before)

---

## Validation Commands

### Install
```bash
cd backend && npm install
```
EXPECT: Lock file updated, `node_modules/@googleapis/forms` present, `googleapis` absent

### Type Check
```bash
cd backend && npx tsc --noEmit -p tsconfig.json
```
EXPECT: Zero type errors

### Unit Tests
```bash
cd backend && npm test
```
EXPECT: All tests pass, no regressions

### Build
```bash
cd backend && npm run build
```
EXPECT: Clean compile to `dist/`

### Manual Validation
- [ ] Start the backend (`npm run dev`) and call `POST /forms/create` with a valid DSL
      payload and a real Google OAuth2 access token — form is created and URL returned

---

## Acceptance Criteria
- [ ] `googleapis` removed from `package.json`
- [ ] `@googleapis/forms` and `google-auth-library` added to `package.json`
- [ ] `google-forms.service.ts` compiles with zero TypeScript errors
- [ ] All existing tests pass unchanged (or with minimal mock path updates)
- [ ] No functional changes to API behaviour

## Completion Checklist
- [ ] Code follows discovered patterns
- [ ] Error handling unchanged
- [ ] Logging unchanged
- [ ] No hardcoded values introduced
- [ ] `npm run build` clean

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `google-auth-library` version mismatch with `googleapis-common` peer dep | Low | Build error | Pin to `^9.0.0` which is what `googleapis-common ^8` requires |
| Test mocks hardcoded to `googleapis` module path | Medium | Tests fail | Grep for `jest.mock('googleapis')` and update path to `@googleapis/forms` |
| Variable name collision (`forms` import vs `forms` local var) | High (predictable) | TypeScript error | Always rename local var to `formsClient` |

## Notes

**Is the migration worth it?** Yes. It reduces the installed footprint significantly (~95%
reduction for the forms-related code), narrows the type surface to only Forms API types,
and follows Google's own recommendation (per-service packages are the idiomatic path going
forward). The migration is low-risk and mechanical — 2 files, ~5 line changes.

**Is the current implementation up-to-date?** Yes. All API calls use the correct v1 patterns,
field masks are applied correctly for `updateSettings`, `isCorrect` and `itemId` were
already removed in prior fixes, and the limitations (`collectEmails` etc.) are documented
with warn logs as they should be.
