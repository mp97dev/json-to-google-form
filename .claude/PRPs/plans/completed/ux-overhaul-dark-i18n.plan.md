# Plan: UX Overhaul — Editor-First Landing, Dark Theme, IT/EN i18n

## Summary
Restructure the Angular frontend so the editor and guide are the main landing page (no login wall), defer Google OAuth to the final "Crea Form" step, apply a dark theme with flat/crisp styling, and add an Italian/English language switcher with Italian as default.

## User Story
As a user visiting the app for the first time, I want to immediately see what the tool does and start building my form without being forced to log in, so that I engage with the product before committing to an OAuth handshake.

## Problem → Solution
Current: Login wall at `/` blocks all engagement → user must authenticate before seeing any value → friction kills conversion.
Desired: Editor + guide on `/` immediately → full feature exploration without login → Google OAuth triggered only when "Crea Form" is clicked → user already invested before auth step.

## Metadata
- **Complexity**: Large
- **Source PRD**: N/A
- **PRD Phase**: N/A
- **Estimated Files**: 11 files changed/created

---

## UX Design

### Before
```
┌───────────────────────────────────────────┐
│  / (Login page — FIRST thing user sees)   │
│  ┌─────────────────────────────────────┐  │
│  │  Proof Of Concept                   │  │
│  │  Login to Continue                  │  │
│  │  [G  Login with Google]             │  │
│  │  Callback endpoint: localhost:3000  │  │
│  └─────────────────────────────────────┘  │
└───────────────────────────────────────────┘
  ↓ after login
┌───────────────────────────────────────────┐
│  /editor                                  │
│  Form Editor                              │
│  [How to use guide — collapsible]         │
│  [Textarea]                               │
│  [Validate] [Create Form]                 │
└───────────────────────────────────────────┘
```

### After
```
┌─────────────────────────────────────────────────┐
│  HEADER: json→form   [IT | EN]                  │
├─────────────────────────────────────────────────┤
│  HERO                                           │
│  Crea Google Form da JSON con AI                │
│  Incolla il JSON generato da un AI e            │
│  trasformalo in Google Form in secondi.         │
├─────────────────────────────────────────────────┤
│  GUIDE (prominent, always visible)              │
│  ① Chiedi al tuo AI  ② Copia il prompt         │
│     [Copia Prompt LLM]                          │
│  ③ Incolla il JSON   ④ Crea il form            │
│     (richiede Google)                           │
├─────────────────────────────────────────────────┤
│  EDITOR (bottom section)                        │
│  ┌──────────────────────────────────────────┐   │
│  │  {  Incolla qui il tuo JSON...           │   │
│  │                                          │   │
│  └──────────────────────────────────────────┘   │
│  [Valida JSON]            [Crea Form →]         │
│                                                 │
│  ✓ JSON Valido  /  ✗ Errori                    │
└─────────────────────────────────────────────────┘
```

### Interaction Changes
| Touchpoint | Before | After | Notes |
|---|---|---|---|
| First page load | Login wall | Guide + editor | Zero friction entry |
| "Crea Form" click — not logged in | N/A (had to login first) | Saves JSON, triggers OAuth | JSON persisted in sessionStorage key `pending_dsl` |
| OAuth callback | Redirects to `/editor` | Restores JSON, shows at `/` | `pending_dsl` restored before editor render |
| "Login with Google" | Visible on landing | Hidden until Create Form | Still reachable via callback flow |
| Language toggle | Not present | IT/EN toggle in header | IT = default, stored in localStorage |

---

## Mandatory Reading

Files that MUST be read before implementing:

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 | `frontend/src/app/app.component.ts` | all | Being rewritten — current styles/logic to preserve intent |
| P0 | `frontend/src/app/editor/editor.component.ts` | all | All editor logic moves here; must port 1:1 |
| P0 | `frontend/src/app/callback/callback.component.ts` | all | Must update redirect target |
| P0 | `frontend/src/app/app.routes.ts` | all | Route restructure |
| P1 | `frontend/src/app/app-shell.component.ts` | all | Add header here |
| P1 | `frontend/src/app/services/forms.service.ts` | all | Service interface stays unchanged |
| P1 | `frontend/src/styles.css` | all | Global CSS gets dark theme variables |
| P2 | `frontend/src/app/editor/editor.component.spec.ts` | all | Test patterns to follow for new specs |
| P2 | `frontend/src/app/app.component.spec.ts` | all | Existing spec to update |
| P2 | `frontend/src/index.html` | all | Update lang attr |

## External Documentation
| Topic | Source | Key Takeaway |
|---|---|---|
| Angular signals | Internal | Angular 19 has `signal()` and `computed()` built-in — use for language state; no NgRx needed |
| Angular standalone | Internal | All existing components use `standalone: true` — new files must follow the same pattern |

---

## Patterns to Mirror

### COMPONENT_NAMING
```typescript
// SOURCE: frontend/src/app/editor/editor.component.ts:1-8
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsService } from '../services/forms.service';

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
```
Rule: selector = `app-<kebab>`, filename = `<kebab>.component.ts`, class = `<Pascal>Component`.

### SERVICE_PATTERN
```typescript
// SOURCE: frontend/src/app/services/forms.service.ts:16-18
@Injectable({ providedIn: 'root' })
export class FormsService {
  private readonly base = environment.apiBaseUrl;
```
Rule: `providedIn: 'root'`, `readonly` for injected deps and constants.

### STATE_PATTERN
```typescript
// SOURCE: frontend/src/app/editor/editor.component.ts:6,173-179
type AppState = 'idle' | 'validating' | 'creating' | 'success' | 'error';

export class EditorComponent {
  dslJson = '';
  state: AppState = 'idle';
  errors: string[] = [];
  validationOk = false;
  formUrl = '';
  serverError = '';
```
Rule: Use a union type string literal for state machine; no state management library.

### SESSION_STORAGE_PATTERN
```typescript
// SOURCE: frontend/src/app/editor/editor.component.ts:247-250
const token = sessionStorage.getItem('access_token');
if (!token) {
  this.state = 'error';
  this.serverError = 'Not authenticated. Please login first.';
```
Rule: `sessionStorage` for transient auth token (cleared on tab close).

### TEST_STRUCTURE
```typescript
// SOURCE: frontend/src/app/editor/editor.component.spec.ts:20-32
function makeService() {
  return { validate: jest.fn(), createForm: jest.fn() };
}

describe('EditorComponent', () => {
  let comp: EditorComponent;
  let svc: ReturnType<typeof makeService>;

  beforeEach(() => {
    svc = makeService();
    comp = new EditorComponent(svc as unknown as FormsService);
    mockSessionStorage.clear();
  });
```
Rule: Plain `new ComponentClass(mockDep)` — no Angular TestBed. Mock factories via `makeService()`. Mock sessionStorage/clipboard in `beforeAll`.

### INLINE_STYLES_PATTERN
```typescript
// SOURCE: frontend/src/app/editor/editor.component.ts:82-170
styles: [`
  .editor-shell { min-height: 100vh; ... }
  .editor-card { width: min(720px, 100%); ... }
`]
```
Rule: All styles are inline in the `styles` array of the component decorator — no separate `.scss` files.

### OBSERVABLE_SUBSCRIBE_PATTERN
```typescript
// SOURCE: frontend/src/app/editor/editor.component.ts:226-239
this.formsService.validate(payload).subscribe({
  next: (res) => {
    this.state = 'idle';
    if (res.valid) { this.validationOk = true; }
    else { this.errors = res.errors; }
  },
  error: (err) => {
    this.state = 'error';
    this.serverError = err?.message ?? 'Validation request failed';
  },
});
```
Rule: Object-form `.subscribe({ next, error })`. No `.pipe(catchError(...))` wrappers.

---

## Files to Change

| File | Action | Justification |
|---|---|---|
| `frontend/src/app/app.component.ts` | REWRITE | Becomes the main landing page with guide + editor merged |
| `frontend/src/app/editor/editor.component.ts` | DELETE | Logic merged into app.component.ts |
| `frontend/src/app/editor/editor.component.spec.ts` | DELETE | Tests moved to app.component.spec.ts |
| `frontend/src/app/app.component.spec.ts` | REWRITE | Cover new AppComponent behaviour (port from editor spec) |
| `frontend/src/app/app.routes.ts` | UPDATE | Remove `/editor` route; `/callback` stays |
| `frontend/src/app/callback/callback.component.ts` | UPDATE | Redirect to `/` instead of `/editor` |
| `frontend/src/app/app-shell.component.ts` | UPDATE | Add header: app name + lang toggle + `<router-outlet>` |
| `frontend/src/styles.css` | REWRITE | Dark theme CSS custom properties |
| `frontend/src/index.html` | UPDATE | `lang="it"`, update title |
| `frontend/src/app/services/i18n.service.ts` | CREATE | IT/EN strings + language signal |

## NOT Building
- No external i18n library (no ngx-translate, no @angular/localize) — simple service with a signal is enough
- No routing for the editor (it's at `/` — no need for `/editor`)
- No lazy loading (app is small)
- No theme switcher (dark only)
- No modal component for login — plain redirect flow
- No backend changes — backend API stays identical
- No animations/transitions beyond CSS

---

## Step-by-Step Tasks

### Task 1: Create I18nService
- **ACTION**: Create `frontend/src/app/services/i18n.service.ts`
- **IMPLEMENT**:
  ```typescript
  import { Injectable, signal } from '@angular/core';

  export type Lang = 'it' | 'en';

  const STRINGS = {
    it: {
      appTagline: 'Crea Google Form da JSON con AI',
      appDesc: 'Incolla il JSON generato da un AI assistant e trasformalo in un Google Form in secondi.',
      guideTitle: 'Come usare questa app',
      step1Title: 'Chiedi al tuo AI assistant',
      step1Desc: 'Descrivi il form o quiz che vuoi creare — argomento, numero di domande, tipologia, modalità (sondaggio o quiz).',
      step2Title: 'Copia il prompt JSON',
      step2Desc: 'Clicca il pulsante qui sotto, poi incollalo nella chat del tuo AI per ricevere un JSON valido.',
      step3Title: 'Incolla il JSON',
      step3Desc: "Copia il JSON che ti restituisce l'AI e incollalo nell'editor qui sotto — la validazione avviene automaticamente.",
      step4Title: 'Genera il form',
      step4Desc: 'Controlla eventuali errori, correggili se necessario, poi clicca Crea Form (richiede accesso Google).',
      copyPrompt: 'Copia Prompt LLM',
      copied: 'Copiato!',
      placeholder: '{\n  "id": "form-1",\n  "title": "Il mio form",\n  ...\n}',
      validate: 'Valida JSON',
      validating: 'Validazione…',
      createForm: 'Crea Form',
      creating: 'Creazione…',
      validDsl: 'JSON Valido',
      validationErrors: 'Errori di validazione:',
      formCreated: 'Form creato!',
      openForm: 'Apri Google Form ↗',
      notAuth: 'Accesso Google richiesto. Verrai reindirizzato…',
      errorPrefix: 'Errore:',
      invalidJson: 'Sintassi JSON non valida',
    },
    en: {
      appTagline: 'Build Google Forms from JSON with AI',
      appDesc: 'Paste AI-generated JSON and turn it into a Google Form in seconds.',
      guideTitle: 'How to use this app',
      step1Title: 'Chat with your AI assistant',
      step1Desc: 'Describe the form or quiz you need — topic, number of questions, type, mode (survey or quiz).',
      step2Title: 'Copy the JSON prompt',
      step2Desc: 'Click the button below, then paste it into your AI chat to get a valid JSON response.',
      step3Title: 'Paste the JSON',
      step3Desc: 'Copy the JSON the AI returns and paste it into the editor below — validation happens automatically.',
      step4Title: 'Generate your form',
      step4Desc: 'Review any validation errors, fix them if needed, then click Create Form (requires Google login).',
      copyPrompt: 'Copy LLM Prompt',
      copied: 'Copied!',
      placeholder: '{\n  "id": "form-1",\n  "title": "My form",\n  ...\n}',
      validate: 'Validate JSON',
      validating: 'Validating…',
      createForm: 'Create Form',
      creating: 'Creating…',
      validDsl: 'Valid JSON',
      validationErrors: 'Validation errors:',
      formCreated: 'Form created!',
      openForm: 'Open Google Form ↗',
      notAuth: 'Google login required. Redirecting…',
      errorPrefix: 'Error:',
      invalidJson: 'Invalid JSON syntax',
    },
  } as const;

  export type StringKey = keyof typeof STRINGS.it;

  @Injectable({ providedIn: 'root' })
  export class I18nService {
    private readonly _lang = signal<Lang>(
      (localStorage.getItem('lang') as Lang | null) ?? 'it'
    );

    readonly lang = this._lang.asReadonly();

    t(key: StringKey): string {
      return STRINGS[this._lang()][key];
    }

    toggle(): void {
      const next: Lang = this._lang() === 'it' ? 'en' : 'it';
      localStorage.setItem('lang', next);
      this._lang.set(next);
    }
  }
  ```
- **MIRROR**: SERVICE_PATTERN
- **IMPORTS**: `signal` from `@angular/core` (Angular 19 built-in)
- **GOTCHA**: `localStorage` is only available in the browser — no SSR here so safe. `signal()` requires Angular 16+; project is on v19.
- **VALIDATE**: `npx tsc --noEmit` from `frontend/` — no type errors

### Task 2: Rewrite AppComponent (main landing + editor)
- **ACTION**: Completely rewrite `frontend/src/app/app.component.ts`
- **IMPLEMENT**: Full standalone component with:
  - Hero section (tagline + description via `i18n.t()`)
  - 4-step guide with "Copia Prompt LLM" button in step 2
  - Textarea editor at bottom with `[(ngModel)]` and `(paste)="onPaste()"`
  - Validate + Create Form buttons
  - Result panels (valid / errors / success / error)
  - All state machine logic ported from `EditorComponent` verbatim
  - "Create Form" when no token: saves `dslJson` to `sessionStorage('pending_dsl')`, then redirects to login
  - Inject `I18nService` as `readonly i18n`
  - `implements OnInit` to restore `pending_dsl` after OAuth callback

  Key `create()` change:
  ```typescript
  create(): void {
    this.reset();
    const payload = this.parseDsl();
    if (!payload) return;

    const token = sessionStorage.getItem('access_token');
    if (!token) {
      sessionStorage.setItem('pending_dsl', this.dslJson);
      window.location.href = `${environment.apiBaseUrl}/auth/google/login`;
      return;
    }

    this.state = 'creating';
    this.formsService.createForm(payload, token).subscribe({
      next: (res) => { this.state = 'success'; this.formUrl = res.formUrl; },
      error: (err) => {
        this.state = 'error';
        this.serverError = err?.error?.message ?? err?.message ?? 'Form creation failed';
      },
    });
  }
  ```

  `ngOnInit` for pending_dsl restore:
  ```typescript
  ngOnInit(): void {
    const pending = sessionStorage.getItem('pending_dsl');
    if (pending) {
      this.dslJson = pending;
      sessionStorage.removeItem('pending_dsl');
      this.validate();
    }
  }
  ```

  Dark theme styles using CSS vars (see Task 3):
  ```
  :host block, max-width 760px, margin auto, padding 2rem 1rem
  .hero: text-center, padding 2rem 0 1.5rem
  .hero h1: clamp(1.6rem, 4vw, 2.4rem), color var(--text-primary), font-weight 700
  .hero-desc: color var(--text-secondary)
  .guide: background var(--surface), border 1px solid var(--border), border-radius 10px
  .guide-title: color var(--accent), uppercase, letter-spacing .07em, font-size .78rem
  .guide-steps li strong: color var(--text-primary)
  .guide-steps li span: color var(--text-secondary), font-size .85rem
  textarea: font-family monospace, background var(--surface), color var(--text-primary),
            border 1px solid var(--border), no box-shadow
  textarea:focus: border-color var(--accent)
  .btn-primary: background var(--accent), color #0d1117
  .result-valid: border 1px solid var(--success), color var(--success), no background fill
  .result-error: border 1px solid var(--error), color var(--error)
  .result-success: border 1px solid var(--accent)
  ```

- **MIRROR**: STATE_PATTERN, OBSERVABLE_SUBSCRIBE_PATTERN, SESSION_STORAGE_PATTERN, INLINE_STYLES_PATTERN
- **IMPORTS**: `Component, OnInit` from `@angular/core`; `CommonModule` from `@angular/common`; `FormsModule` from `@angular/forms`; `FormsService` from `../services/forms.service`; `I18nService` from `../services/i18n.service`; `environment` from `../../environments/environment`
- **GOTCHA**: `*ngIf` requires `CommonModule` in imports. `[(ngModel)]` requires `FormsModule`. The `LLM_PROMPT` constant — copy it verbatim from `editor.component.ts:182-202`, do not alter it.
- **VALIDATE**: Template compiles, `ng build` passes

### Task 3: Dark Theme global styles
- **ACTION**: Rewrite `frontend/src/styles.css`
- **IMPLEMENT**:
  ```css
  :root {
    color-scheme: dark;
    --bg: #0d1117;
    --surface: #161b22;
    --border: #30363d;
    --text-primary: #e6edf3;
    --text-secondary: #8b949e;
    --accent: #58a6ff;
    --accent-hover: #79b8ff;
    --success: #3fb950;
    --error: #f85149;
    font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  }

  html, body {
    margin: 0;
    padding: 0;
    background: var(--bg);
    color: var(--text-primary);
    min-height: 100vh;
  }

  * { box-sizing: border-box; }

  a { color: var(--accent); }
  a:hover { color: var(--accent-hover); }
  ```
- **MIRROR**: INLINE_STYLES_PATTERN
- **GOTCHA**: Do NOT add `box-shadow` anywhere. No `background-image` gradients. Flat look only. Component styles will inherit these vars.
- **VALIDATE**: Visual inspection — dark background, no shadows

### Task 4: Update AppShellComponent with header
- **ACTION**: Rewrite `frontend/src/app/app-shell.component.ts`
- **IMPLEMENT**:
  ```typescript
  import { Component } from '@angular/core';
  import { RouterOutlet } from '@angular/router';
  import { I18nService } from './services/i18n.service';

  @Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterOutlet],
    template: `
      <header class="app-header">
        <span class="app-name">json → form</span>
        <button class="lang-toggle" (click)="i18n.toggle()">
          {{ i18n.lang() === 'it' ? 'EN' : 'IT' }}
        </button>
      </header>
      <router-outlet />
    `,
    styles: [`
      .app-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: .75rem 1.5rem;
        border-bottom: 1px solid var(--border);
        background: var(--surface);
        position: sticky;
        top: 0;
        z-index: 10;
      }
      .app-name {
        font-family: 'JetBrains Mono', 'Fira Code', monospace;
        font-size: .95rem;
        font-weight: 700;
        color: var(--text-primary);
        letter-spacing: -.02em;
      }
      .lang-toggle {
        padding: .3rem .8rem;
        border-radius: 5px;
        border: 1px solid var(--border);
        background: transparent;
        color: var(--text-secondary);
        font-size: .82rem;
        font-weight: 600;
        cursor: pointer;
        letter-spacing: .04em;
      }
      .lang-toggle:hover {
        border-color: var(--accent);
        color: var(--accent);
      }
    `],
  })
  export class AppShellComponent {
    constructor(readonly i18n: I18nService) {}
  }
  ```
- **MIRROR**: COMPONENT_NAMING, SERVICE_PATTERN
- **IMPORTS**: `RouterOutlet` from `@angular/router`; `I18nService` from `./services/i18n.service`
- **GOTCHA**: `RouterOutlet` must stay in `imports` array — required for `<router-outlet>` to resolve in the template. Note the label shows opposite of current lang (e.g. when on IT, show "EN" as the target to switch to).
- **VALIDATE**: Header renders sticky at top; toggle button visible

### Task 5: Update routes — remove /editor
- **ACTION**: Rewrite `frontend/src/app/app.routes.ts`
- **IMPLEMENT**:
  ```typescript
  import { Routes } from '@angular/router';
  import { AppComponent } from './app.component';
  import { CallbackComponent } from './callback/callback.component';

  export const routes: Routes = [
    { path: '', component: AppComponent },
    { path: 'callback', component: CallbackComponent },
    { path: '**', redirectTo: '' },
  ];
  ```
- **MIRROR**: N/A
- **IMPORTS**: Remove `EditorComponent` import entirely
- **GOTCHA**: Any existing bookmark to `/editor` falls through `**` wildcard to `/` — acceptable.
- **VALIDATE**: `ng build` passes (no dangling imports)

### Task 6: Update CallbackComponent — redirect to /
- **ACTION**: Update `frontend/src/app/callback/callback.component.ts`
- **IMPLEMENT**: Change only the redirect target from `/editor` to `/`:
  ```typescript
  if (token) {
    sessionStorage.setItem('access_token', token);
    void this.router.navigate(['/']);   // was: ['/editor']
  }
  ```
  All other logic stays identical.
- **MIRROR**: SESSION_STORAGE_PATTERN
- **IMPORTS**: No changes
- **GOTCHA**: `pending_dsl` does NOT need to be touched here — AppComponent's `ngOnInit` reads it from sessionStorage automatically when it mounts at `/`.
- **VALIDATE**: After OAuth flow, browser lands at `/` with textarea populated

### Task 7: Update index.html
- **ACTION**: Update `frontend/src/index.html`
- **IMPLEMENT**:
  ```html
  <!doctype html>
  <html lang="it">
    <head>
      <meta charset="utf-8" />
      <title>JSON → Google Form</title>
      <base href="/" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="description" content="Crea Google Form da JSON con AI" />
    </head>
    <body>
      <app-root></app-root>
    </body>
  </html>
  ```
- **MIRROR**: N/A
- **GOTCHA**: `lang="it"` is set statically. The JS language toggle changes content strings but not this HTML attribute — acceptable for a PoC.
- **VALIDATE**: Browser tab shows "JSON → Google Form"

### Task 8: Delete EditorComponent files
- **ACTION**: Delete `frontend/src/app/editor/editor.component.ts` and `frontend/src/app/editor/editor.component.spec.ts`
- **IMPLEMENT**: Run `rm` after verifying no imports remain:
  ```bash
  grep -r "EditorComponent" frontend/src  # must return zero results first
  rm frontend/src/app/editor/editor.component.ts
  rm frontend/src/app/editor/editor.component.spec.ts
  ```
- **MIRROR**: N/A
- **GOTCHA**: Run the grep check BEFORE deleting. If anything still imports it, fix that import first.
- **VALIDATE**: `grep -r "EditorComponent" frontend/src` returns zero after deletion; `ng build` passes

### Task 9: Rewrite app.component.spec.ts
- **ACTION**: Rewrite `frontend/src/app/app.component.spec.ts` — port all editor tests + add new tests
- **IMPLEMENT**:
  ```typescript
  import { of, throwError } from 'rxjs';
  import { AppComponent } from './app.component';
  import { FormsService } from './services/forms.service';
  import { I18nService } from './services/i18n.service';

  const store: Record<string, string> = {};
  const mockSessionStorage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
  };
  const mockClipboard = { writeText: jest.fn().mockResolvedValue(undefined) };

  beforeAll(() => {
    Object.defineProperty(global, 'sessionStorage', { value: mockSessionStorage, configurable: true });
    Object.defineProperty(global.navigator, 'clipboard', { value: mockClipboard, configurable: true });
  });

  function makeService() {
    return { validate: jest.fn(), createForm: jest.fn() };
  }

  function makeI18n() {
    return { t: (k: string) => k, lang: () => 'it', toggle: jest.fn() };
  }

  describe('AppComponent', () => {
    let comp: AppComponent;
    let svc: ReturnType<typeof makeService>;

    beforeEach(() => {
      svc = makeService();
      comp = new AppComponent(
        svc as unknown as FormsService,
        makeI18n() as unknown as I18nService,
      );
      mockSessionStorage.clear();
    });

    // --- ported from editor spec ---
    it('isWorking is false when state is idle', ...);
    it('isWorking is true while validating', ...);
    it('validate: sets errors on invalid JSON', ...);
    it('validate: sets validationOk on successful validation', ...);
    it('validate: sets errors array on validation failure', ...);
    it('create: sets formUrl on success', ...);
    it('create: sets serverError on http failure', ...);
    it('copyPrompt: calls clipboard.writeText', ...);
    it('copyPrompt: resets promptCopied after 2s', ...);
    it('onPaste: triggers validate after 500ms', ...);
    it('onPaste: debounces rapid calls', ...);

    // --- NEW tests ---
    it('create: saves pending_dsl and redirects when not authenticated', () => {
      comp.dslJson = '{"title":"T"}';
      mockSessionStorage.removeItem('access_token');
      const originalLocation = window.location.href;
      // Spy on window.location.href assignment is tricky — just verify pending_dsl is set
      // and that the method does NOT call createForm
      comp.create();
      expect(mockSessionStorage.getItem('pending_dsl')).toBe('{"title":"T"}');
      expect(svc.createForm).not.toHaveBeenCalled();
    });

    it('ngOnInit: restores pending_dsl from sessionStorage and auto-validates', () => {
      mockSessionStorage.setItem('pending_dsl', '{"title":"restored"}');
      svc.validate.mockReturnValue(of({ valid: true, errors: [] }));
      comp.ngOnInit();
      expect(comp.dslJson).toBe('{"title":"restored"}');
      expect(mockSessionStorage.getItem('pending_dsl')).toBeNull();
      expect(svc.validate).toHaveBeenCalledTimes(1);
    });

    it('ngOnInit: does nothing when no pending_dsl', () => {
      comp.ngOnInit();
      expect(comp.dslJson).toBe('');
      expect(svc.validate).not.toHaveBeenCalled();
    });
  });
  ```
- **MIRROR**: TEST_STRUCTURE
- **IMPORTS**: `AppComponent`, `FormsService`, `I18nService`, `of`/`throwError` from rxjs
- **GOTCHA**: `AppComponent` constructor now takes TWO args: `(formsService, i18n)`. Update all `new AppComponent(...)` calls. `window.location.href` assignment cannot be easily asserted in Jest without `jest.spyOn` on the `location` object — test the `pending_dsl` side-effect instead.
- **VALIDATE**: `npm test` in frontend/ — all tests pass

---

## Testing Strategy

### Unit Tests

| Test | Input | Expected Output | Edge Case? |
|---|---|---|---|
| `isWorking` false at idle | state='idle' | false | No |
| `isWorking` true while validating | in-flight validate call | true | No |
| `validate` invalid JSON | `'not-json'` | errors=['invalidJson'], state='error' | No |
| `validate` success | valid JSON, mock `{valid:true}` | validationOk=true | No |
| `validate` failure | valid JSON, mock errors | errors set | No |
| `create` no token | no sessionStorage token | pending_dsl saved, createForm not called | Yes |
| `create` success | token present | formUrl set, state='success' | No |
| `create` server error | token present, mock throws | serverError set | No |
| `copyPrompt` | clipboard available | writeText called with schema string | No |
| `onPaste` debounce | rapid 3 calls | validate fires once after 500ms | Yes |
| `ngOnInit` pending_dsl present | pending in sessionStorage | dslJson set, key removed, validate called | Yes |
| `ngOnInit` no pending_dsl | empty sessionStorage | no-op | No |
| `I18nService.t` IT | lang='it' | Italian string returned | No |
| `I18nService.toggle` | starts 'it' | becomes 'en', localStorage updated | No |

### Edge Cases Checklist
- [x] Empty textarea on validate — JSON parse error
- [x] Paste with no content — debounce fires, parseDsl returns null gracefully
- [x] Create Form without token — saves pending_dsl, redirects (no crash)
- [x] Callback with token → mounts AppComponent → ngOnInit restores pending_dsl
- [x] Language toggle persists across page reload (localStorage)
- [x] No pending_dsl on fresh load — ngOnInit is a no-op

---

## Validation Commands

### Static Analysis
```bash
cd frontend && npx tsc -p tsconfig.app.json --noEmit
```
EXPECT: Zero type errors

### Unit Tests
```bash
cd frontend && npm test
```
EXPECT: All tests pass

### Full Test Suite
```bash
npm test --workspaces
```
EXPECT: No regressions in backend or CLI tests

### Dead Import Check
```bash
grep -r "EditorComponent" /workspaces/json-to-google-form/frontend/src
```
EXPECT: Zero results after Task 8

### Build Verification
```bash
cd frontend && npm run build
```
EXPECT: Build completes with zero errors

### Manual Validation
- [ ] App loads at `/` — dark background (#0d1117), no white cards
- [ ] Header shows "json → form" (monospace) left, language toggle right
- [ ] Toggle shows "EN" when Italian is active; click → all text switches to English
- [ ] Toggle shows "IT" when English is active; click → all text switches to Italian
- [ ] Language persists on manual page refresh
- [ ] Guide steps are the dominant visual element — visible immediately, no login required
- [ ] "Copia Prompt LLM" button copies prompt; label changes to "Copiato!" for 2s
- [ ] Paste JSON into textarea — auto-validation fires ~500ms after paste
- [ ] "Valida JSON" button shows green "JSON Valido" border panel on valid input
- [ ] Validation errors appear in red border panel
- [ ] Click "Crea Form" without token → browser redirects to Google OAuth
- [ ] After OAuth, browser returns to app at `/` with previously-pasted JSON restored
- [ ] Successful form creation shows blue-bordered panel with link
- [ ] Zero `box-shadow` visible anywhere (inspect with DevTools)
- [ ] Textarea uses monospace font with dark background
- [ ] No gradients in background

---

## Acceptance Criteria
- [ ] `/` loads editor + guide without requiring login
- [ ] Google OAuth only triggered on "Crea Form" click when no token present
- [ ] Italian strings shown by default
- [ ] EN toggle switches all UI text; IT toggle switches back
- [ ] Language choice persists in localStorage across page reloads
- [ ] Dark theme throughout — no white cards, no box-shadows, no gradients
- [ ] All unit tests pass with `npm test`
- [ ] `ng build` passes with zero errors and zero type errors

## Completion Checklist
- [ ] Code follows `standalone: true` pattern throughout
- [ ] `I18nService` uses Angular `signal()` — no BehaviorSubject
- [ ] No `box-shadow` in any component styles
- [ ] EditorComponent files deleted and verified absent
- [ ] Routes updated (no `/editor` route remains)
- [ ] Callback redirects to `/`
- [ ] `pending_dsl` restore flow tested in spec
- [ ] Test mock uses plain `new AppComponent(dep, dep2)` — no TestBed
- [ ] No hardcoded Italian/English strings in templates (all via `i18n.t()`)
- [ ] LLM_PROMPT constant copied verbatim — not altered

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `signal()` reactivity not triggering template re-render | Low | High | Call `i18n.lang()` (invocable signal, not property) in template expressions; Angular 19 tracks signal reads |
| `pending_dsl` lost if user opens OAuth in new tab | Medium | Medium | Acceptable for PoC — sessionStorage is per-tab; can switch to localStorage later |
| CSS vars not inherited inside component inline styles | Low | Low | Vars defined in `:root` in global styles.css — component styles DO inherit them |
| `localStorage` throws in Safari private mode | Low | Low | Wrap `localStorage` access in try/catch in I18nService; fall back to in-memory default |

## Notes
- Angular 19 standalone components do NOT need `NgModule` — all new/updated components use `standalone: true`
- The `LLM_PROMPT` private constant in EditorComponent (lines 182-202) must be copied verbatim to AppComponent — do not alter it
- Backend is untouched — all API contracts (`POST /forms/validate`, `POST /forms/create`) remain identical
- The `/editor` route removal is safe because the wildcard `**` catches it and redirects to `/`
- `I18nService.t()` is a plain method call, not a pipe — simpler to test, no pipe registration needed in imports
- `i18n.lang()` is called as a function in the template (signal accessor) — this is intentional, not a mistake
