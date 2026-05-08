# Plan: LLM Prompt Copy + 4-Step Guide in Form Editor

## Summary
Add a collapsible AI Assistant guide to the Form Editor page with four numbered steps. Step 2 includes a "Copy Prompt" button that puts a complete LLM instruction prompt (explaining the DSL schema) into the clipboard. The textarea gains auto-validation on paste events (500 ms debounce) so JSON pasted from an LLM response is checked immediately.

## User Story
As a form creator, I want a copy-paste workflow between any LLM and the JSON editor, so that I can describe my form in natural language and turn the LLM response directly into a Google Form without manually constructing JSON.

## Problem → Solution
Currently the editor gives no guidance on how to produce valid DSL JSON. → Add a step-by-step guide with a pre-written LLM prompt that explains the schema, plus auto-validation on paste.

## Metadata
- **Complexity**: Small
- **Source PRD**: N/A
- **PRD Phase**: N/A
- **Estimated Files**: 1

---

## UX Design

### Before
```
┌─────────────────────────────────────────┐
│  Form Editor                            │
│  Paste your JSON DSL below...           │
│                                         │
│  [ textarea ]                           │
│                                         │
│  [Validate]  [Create Form]              │
└─────────────────────────────────────────┘
```

### After
```
┌─────────────────────────────────────────┐
│  Form Editor                            │
│                                         │
│  ┌─ How to use AI to build your form ─┐ │
│  │  Step 1 ─ Chat with your LLM       │ │
│  │  Describe your form in the chat.   │ │
│  │                                     │ │
│  │  Step 2 ─ Copy the prompt          │ │
│  │  [ Copy LLM Prompt ✓ ]             │ │
│  │  Paste it into the same chat.      │ │
│  │                                     │ │
│  │  Step 3 ─ Paste the JSON           │ │
│  │  Copy the JSON the LLM generates   │ │
│  │  and paste it into the editor.     │ │
│  │                                     │ │
│  │  Step 4 ─ Generate your form       │ │
│  │  JSON auto-validates on paste.     │ │
│  │  Hit Create Form when ready.        │ │
│  └─────────────────────────────────────┘ │
│                                         │
│  [ textarea ]                           │
│                                         │
│  [Validate]  [Create Form]              │
└─────────────────────────────────────────┘
```

### Interaction Changes
| Touchpoint | Before | After | Notes |
|---|---|---|---|
| Editor page | No guidance | 4-step guide above textarea | Always visible, no toggle needed |
| "Copy LLM Prompt" button | n/a | Copies schema prompt; button label flips to "Copied!" for 2 s | Uses `navigator.clipboard.writeText` |
| Textarea paste | No reaction | Auto-validates after 500 ms debounce | Clears previous results first |

---

## Mandatory Reading

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 (critical) | `frontend/src/app/editor/editor.component.ts` | 1-182 | Entire file to modify — inline template, styles, and class |
| P1 (important) | `dsl/form-dsl.ts` | 1-240 | DSL schema to embed in the LLM prompt text |
| P2 (reference) | `frontend/src/app/editor/editor.component.spec.ts` | 1-93 | Test patterns to follow for new test cases |

## External Documentation
N/A — feature uses established internal patterns only.

---

## Patterns to Mirror

### COMPONENT_STRUCTURE
```typescript
// SOURCE: frontend/src/app/editor/editor.component.ts:1-12
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsService } from '../services/forms.service';

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `...`,
  styles: [`...`],
})
```

### STATE_FIELD_PATTERN
```typescript
// SOURCE: frontend/src/app/editor/editor.component.ts:104-110
export class EditorComponent {
  dslJson = '';
  state: AppState = 'idle';
  errors: string[] = [];
  validationOk = false;
  formUrl = '';
  serverError = '';
```
Add new boolean fields using the same bare initialiser style: `promptCopied = false;`

### TEMPLATE_BUTTON_PATTERN
```html
<!-- SOURCE: frontend/src/app/editor/editor.component.ts:26-31 -->
<button type="button" (click)="validate()" [disabled]="isWorking">
  {{ state === 'validating' ? 'Validating...' : 'Validate' }}
</button>
<button type="button" class="primary" (click)="create()" [disabled]="isWorking">
  {{ state === 'creating' ? 'Creating...' : 'Create Form' }}
</button>
```
Follow the `(click)="methodName()"` binding style; use `[disabled]` for state-based disabling.

### CSS_CARD_PATTERN
```css
/* SOURCE: frontend/src/app/editor/editor.component.ts:56-70 */
.editor-card {
  width: min(720px, 100%);
  background: #fff;
  border-radius: 16px;
  border: 1px solid #dbe6e2;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(16,24,40,.07);
}
```
New nested panels use a lighter inner-card style (background: #f0f7ff, border-radius: 12px).

### TEST_STRUCTURE
```typescript
// SOURCE: frontend/src/app/editor/editor.component.spec.ts:21-28
describe('EditorComponent', () => {
  let comp: EditorComponent;
  let svc: ReturnType<typeof makeService>;

  beforeEach(() => {
    svc = makeService();
    comp = new EditorComponent(svc as unknown as FormsService);
    mockSessionStorage.clear();
  });
```
Tests instantiate the class directly — no Angular TestBed. New tests follow this exact pattern.

### DEBOUNCE_PATTERN
```typescript
// Standard browser setTimeout debounce — no import needed
private debounceTimer: ReturnType<typeof setTimeout> | null = null;

onPaste(): void {
  if (this.debounceTimer) clearTimeout(this.debounceTimer);
  this.debounceTimer = setTimeout(() => this.validate(), 500);
}
```

---

## Files to Change

| File | Action | Justification |
|---|---|---|
| `frontend/src/app/editor/editor.component.ts` | UPDATE | Add guide section, copy button, paste handler, debounce logic |
| `frontend/src/app/editor/editor.component.spec.ts` | UPDATE | Add tests for `copyPrompt()` and `onPaste()` |

## NOT Building
- A modal or dialog for the guide (always-visible section is sufficient)
- LLM API integration (the prompt is copied; the user pastes manually)
- Collapsible/expandable accordion
- Any backend changes
- Multi-language prompt variants

---

## Step-by-Step Tasks

### Task 1: Add class fields for new state
- **ACTION**: Add two new fields to `EditorComponent` class body after the `serverError = ''` line (~line 110)
- **IMPLEMENT**:
  ```typescript
  promptCopied = false;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  ```
- **MIRROR**: STATE_FIELD_PATTERN — bare initialiser, `private` only on internal plumbing
- **IMPORTS**: No new imports needed
- **GOTCHA**: `debounceTimer` must be `private` because it is internal plumbing, not UI state
- **VALIDATE**: TypeScript compiles with zero errors (`npx tsc --noEmit`)

### Task 2: Add `LLM_PROMPT` readonly field
- **ACTION**: Add a `private readonly` field holding the full prompt text, after `debounceTimer`
- **IMPLEMENT**:
  ```typescript
  private readonly LLM_PROMPT = `You are a form-design assistant. Based on our conversation, output ONLY a raw JSON object — no markdown, no explanation, no code blocks.

The JSON must match this schema exactly:

{
  "id": "<unique string, e.g. form_1>",
  "title": "<form title>",
  "description": "<short description>",
  "mode": "form" | "quiz",
  "settings": {
    "collectEmails": true | false,
    "limitOneResponse": true | false,
    "shuffleQuestions": true | false
  },
  "pages": [
    {
      "id": "<unique string, e.g. page_1>",
      "title": "<section title>",
      "questions": [
        {
          "id": "<unique string, e.g. q_1>",
          "type": "text" | "multiple_choice" | "checkbox" | "dropdown" | "true_false" | "short_answer",
          "title": "<question text>",
          "required": true | false,
          "options": ["<opt1>", "<opt2>"],
          "correctAnswer": "<option text — quiz mode only>",
          "score": 1,
          "metadata": {
            "topic": "<optional topic>",
            "difficulty": "easy" | "medium" | "hard"
          }
        }
      ]
    }
  ]
}

Rules:
- Pages are sequential only — no branching.
- Use mode "form" for surveys, "quiz" for graded assessments.
- options is required for types: multiple_choice, checkbox, dropdown.
- correctAnswer and score are only used in quiz mode.
- All id values must be unique strings.
- Output the complete JSON now.`;
  ```
- **MIRROR**: Angular convention — `private readonly` on constants that never change
- **IMPORTS**: None
- **GOTCHA**: The template literal spans multiple lines. Ensure no stray backtick inside breaks the string.
- **VALIDATE**: The string is accessible and non-empty when `copyPrompt()` is called

### Task 3: Add `copyPrompt()` method
- **ACTION**: Add method after the `private reset()` method (~line 176)
- **IMPLEMENT**:
  ```typescript
  copyPrompt(): void {
    navigator.clipboard.writeText(this.LLM_PROMPT).then(() => {
      this.promptCopied = true;
      setTimeout(() => { this.promptCopied = false; }, 2000);
    });
  }
  ```
- **MIRROR**: Same `void` method style as `validate()` and `create()`
- **IMPORTS**: None — `navigator.clipboard` is a browser built-in
- **GOTCHA**: `navigator.clipboard` requires HTTPS or localhost (met by all deployment environments). No fallback needed.
- **VALIDATE**: Clicking the button in browser copies text; button label changes to "Copied!" then reverts

### Task 4: Add `onPaste()` method with 500 ms debounce
- **ACTION**: Add method after `copyPrompt()`
- **IMPLEMENT**:
  ```typescript
  onPaste(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this.validate(), 500);
  }
  ```
- **MIRROR**: DEBOUNCE_PATTERN
- **IMPORTS**: None
- **GOTCHA**: The `(paste)` DOM event fires BEFORE Angular's `ngModel` updates `dslJson`. The 500 ms delay ensures the two-way binding has populated `dslJson` by the time `validate()` reads it.
- **VALIDATE**: Pasting into textarea triggers validation after ~500 ms; rapid pastes produce only one call

### Task 5: Insert the guide section into the template and add `(paste)` to textarea
- **ACTION**: In the template, insert the guide `<div>` between `<p class="hint">` and `<textarea>`. Add `(paste)="onPaste()"` to the textarea.
- **IMPLEMENT** — guide section:
  ```html
  <div class="guide">
    <p class="guide-title">How to use an AI assistant to build your form</p>
    <ol class="guide-steps">
      <li>
        <strong>Chat with your AI assistant</strong>
        <span>Describe the form or quiz you need — topic, number of questions, question types, mode (survey or quiz).</span>
      </li>
      <li>
        <strong>Copy the JSON prompt</strong>
        <span>Click the button below, then paste it into the same chat to get a valid JSON response.</span>
        <button type="button" class="copy-btn" (click)="copyPrompt()">
          {{ promptCopied ? 'Copied!' : 'Copy LLM Prompt' }}
        </button>
      </li>
      <li>
        <strong>Paste the JSON response</strong>
        <span>Copy the JSON the AI returns and paste it into the editor below — it validates automatically.</span>
      </li>
      <li>
        <strong>Generate your form</strong>
        <span>Review any validation errors, fix them if needed, then click <em>Create Form</em>.</span>
      </li>
    </ol>
  </div>
  ```
- **IMPLEMENT** — updated textarea (add `(paste)` binding):
  ```html
  <textarea
    [(ngModel)]="dslJson"
    rows="18"
    placeholder='{ "id": "form-1", "title": "...", ... }'
    [disabled]="state === 'validating' || state === 'creating'"
    (paste)="onPaste()"
  ></textarea>
  ```
- **MIRROR**: TEMPLATE_BUTTON_PATTERN for the copy button; existing textarea pattern for the paste binding
- **IMPORTS**: `CommonModule` already imported (needed for `*ngIf`, `*ngFor`)
- **GOTCHA**: `(paste)` is a standard DOM event — Angular binds it natively without any extra module
- **VALIDATE**: Guide renders with 4 numbered steps; copy button is inside step 2

### Task 6: Add guide and copy button CSS
- **ACTION**: Append new CSS rules inside the existing `styles: [\`...\`]` block, after the last `li` rule
- **IMPLEMENT**:
  ```css
  .guide {
    background: #f0f7ff;
    border: 1px solid #c5daf7;
    border-radius: 12px;
    padding: 1rem 1.25rem;
    margin-bottom: 1.25rem;
  }
  .guide-title {
    margin: 0 0 .75rem;
    font-size: .82rem;
    font-weight: 700;
    color: #1a3a7a;
    text-transform: uppercase;
    letter-spacing: .05em;
  }
  .guide-steps {
    margin: 0;
    padding-left: 1.4rem;
    display: flex;
    flex-direction: column;
    gap: .8rem;
  }
  .guide-steps li {
    font-size: .88rem;
    color: #334155;
    line-height: 1.5;
  }
  .guide-steps li strong { display: block; color: #132238; margin-bottom: .1rem; }
  .guide-steps li span { display: block; margin-bottom: .3rem; }
  .copy-btn {
    margin-top: .2rem;
    padding: .4rem 1rem;
    border-radius: 8px;
    border: 1px solid #0f62fe;
    background: #fff;
    color: #0f62fe;
    font-size: .82rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 120ms ease;
  }
  .copy-btn:hover { background: #e8f0fe; }
  ```
- **MIRROR**: CSS_CARD_PATTERN — same border-radius vocabulary and color palette as the rest of the component
- **IMPORTS**: None
- **GOTCHA**: Angular's ViewEncapsulation scopes these styles to the component — no global leakage
- **VALIDATE**: Blue-tinted guide box renders correctly; copy button is styled distinctly from the primary action buttons

### Task 7: Add tests for `copyPrompt()` and `onPaste()`
- **ACTION**: Add clipboard mock in `beforeAll` and four new `it` blocks inside the existing `describe`
- **IMPLEMENT** — add clipboard mock alongside existing sessionStorage mock in `beforeAll`:
  ```typescript
  const mockClipboard = { writeText: jest.fn().mockResolvedValue(undefined) };
  beforeAll(() => {
    Object.defineProperty(global, 'sessionStorage', { value: mockSessionStorage, configurable: true });
    Object.defineProperty(global.navigator, 'clipboard', { value: mockClipboard, configurable: true });
  });
  ```
- **IMPLEMENT** — new test cases inside `describe('EditorComponent')`:
  ```typescript
  it('copyPrompt: calls clipboard.writeText with the schema prompt', async () => {
    mockClipboard.writeText.mockClear();
    await comp.copyPrompt();
    expect(mockClipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('"mode": "form" | "quiz"'));
    expect(comp.promptCopied).toBe(true);
  });

  it('copyPrompt: resets promptCopied after 2 s', async () => {
    jest.useFakeTimers();
    await comp.copyPrompt();
    expect(comp.promptCopied).toBe(true);
    jest.advanceTimersByTime(2001);
    expect(comp.promptCopied).toBe(false);
    jest.useRealTimers();
  });

  it('onPaste: triggers validate after 500 ms', () => {
    jest.useFakeTimers();
    comp.dslJson = '{"title":"T"}';
    svc.validate.mockReturnValue(of({ valid: true, errors: [] }));
    comp.onPaste();
    expect(svc.validate).not.toHaveBeenCalled();
    jest.advanceTimersByTime(500);
    expect(svc.validate).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });

  it('onPaste: debounces rapid calls — validate fires only once', () => {
    jest.useFakeTimers();
    comp.dslJson = '{}';
    svc.validate.mockReturnValue(of({ valid: false, errors: [] }));
    comp.onPaste();
    comp.onPaste();
    comp.onPaste();
    jest.advanceTimersByTime(600);
    expect(svc.validate).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });
  ```
- **MIRROR**: TEST_STRUCTURE — direct class instantiation, jest fake timers
- **IMPORTS**: `of` is already imported in the spec file
- **GOTCHA**: `copyPrompt()` is async; tests must `await` it or the assertions run before the `.then()` callback. `jest.useFakeTimers()` must always be paired with `jest.useRealTimers()`.
- **VALIDATE**: `npm test` in `frontend/` shows all tests green

---

## Testing Strategy

### Unit Tests

| Test | Input | Expected Output | Edge Case? |
|---|---|---|---|
| `copyPrompt` writes to clipboard | call `copyPrompt()` | `clipboard.writeText` called with schema string | No |
| `promptCopied` resets after 2 s | fake timers, advance 2001 ms | `promptCopied === false` | Yes |
| `onPaste` calls validate after 500 ms | fake timers, advance 500 ms | `svc.validate` called once | No |
| Rapid pastes debounce | call `onPaste()` 3× quickly | `svc.validate` called once | Yes |

### Edge Cases Checklist
- [ ] Clipboard API unavailable — acceptable; app is HTTPS-only in production
- [ ] Paste while already validating — debounce queues; `validate()` resets state first
- [ ] Empty textarea paste — `validate()` returns "Invalid JSON syntax" as expected
- [ ] Very large JSON paste — 500 ms delay fires normally; validation proceeds

---

## Validation Commands

### Static Analysis
```bash
cd /workspaces/json-to-google-form/frontend && npx tsc --noEmit
```
EXPECT: Zero type errors

### Unit Tests
```bash
cd /workspaces/json-to-google-form/frontend && npm test -- --testPathPattern=editor
```
EXPECT: All editor tests pass (9 existing + 4 new = 13 total)

### Full Test Suite
```bash
cd /workspaces/json-to-google-form && npm test
```
EXPECT: No regressions

### Browser Validation
```bash
cd /workspaces/json-to-google-form/frontend && npm run dev
# Open http://localhost:4200/editor
```
EXPECT:
- 4-step guide renders above textarea in a blue-tinted box
- "Copy LLM Prompt" button in step 2 copies text to clipboard
- Button label changes to "Copied!" for 2 seconds then reverts
- Pasting valid JSON auto-validates after ~500 ms (green banner)
- Pasting invalid JSON shows error list after ~500 ms

### Manual Validation
- [ ] Navigate to `/editor` in browser
- [ ] Verify guide box renders with 4 numbered steps
- [ ] Click "Copy LLM Prompt" — paste into any text field to confirm content is the DSL schema prompt
- [ ] Confirm button shows "Copied!" then reverts to "Copy LLM Prompt" after 2 s
- [ ] Paste valid DSL JSON into textarea — confirm auto-validation (green "Valid DSL" banner) after ~500 ms
- [ ] Paste invalid JSON — confirm error list appears after ~500 ms
- [ ] Paste rapidly 3× — confirm validation fires only once

---

## Acceptance Criteria
- [ ] 4-step guide visible above the textarea on `/editor`
- [ ] "Copy LLM Prompt" button in step 2 copies the DSL schema prompt to clipboard
- [ ] Button shows "Copied!" for 2 seconds after click
- [ ] Pasting into textarea auto-validates after 500 ms debounce
- [ ] Rapid pastes produce only one validation call
- [ ] All existing 9 tests still pass
- [ ] 4 new tests pass
- [ ] Zero TypeScript errors

## Completion Checklist
- [ ] Code follows Angular 19 standalone component patterns
- [ ] Error handling matches existing `validate()` style
- [ ] No hardcoded magic numbers beyond the timeout values (which are self-explanatory inline)
- [ ] Tests use fake timers for time-dependent assertions
- [ ] No unnecessary new files or modules created

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `navigator.clipboard` blocked | Low | Medium | HTTPS-only app; clipboard works on user gesture in modern browsers |
| Paste fires before `ngModel` updates | Medium | High | 500 ms delay intentionally larger than Angular's change-detection cycle |
| LLM prompt becomes stale if DSL schema changes | Low | Low | `private readonly` field — easy to update alongside `dsl/form-dsl.ts` |

## Notes
- The guide is permanently visible (no toggle) — the editor is a single-purpose page and the guide is short.
- The LLM prompt is a `private readonly` class field for easy future updates.
- No new Angular modules or services required — this is a pure component change.
- `copyPrompt()` internally uses `.then()` (not `async/await`) to keep the method signature `void`, matching the existing code style.
