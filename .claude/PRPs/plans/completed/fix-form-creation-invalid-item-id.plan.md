# Plan: Fix Form Creation — Invalid itemId in batchUpdate

## Summary
Form creation fails at the batchUpdate step because `itemId: question.id` is sent to the Google Forms API with DSL-format strings like `"q_1"`. Google only accepts numeric IDs for `itemId`, and only for items that already exist. Removing `itemId` from all `createItem` requests lets Google auto-assign valid IDs and unblocks form creation entirely.

## User Story
As a user, I want to submit a DSL JSON and have a Google Form created, so that my form or quiz appears in my Google Drive without errors.

## Problem → Solution
`mapQuestion()` attaches `itemId: question.id` (e.g. `"q_1"`) to every createItem payload → Google Forms API v1 returns `GaxiosError: q_1: Invalid ID` during batchUpdate. → Remove `itemId` from createItem payloads; Google auto-assigns valid numeric IDs.

## Metadata
- **Complexity**: Small
- **Source PRD**: N/A
- **PRD Phase**: N/A
- **Estimated Files**: 2 (mapper.service.ts + mapper.service.spec.ts)

---

## UX Design

N/A — internal change. The API response `{ formId, formUrl }` is unchanged; form creation now succeeds instead of throwing 500.

---

## Mandatory Reading

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 | [backend/src/forms/mapper.service.ts](backend/src/forms/mapper.service.ts) | 47-109 | Contains the bug — itemId on both choice and text question paths |
| P0 | [backend/src/forms/mapper.service.spec.ts](backend/src/forms/mapper.service.spec.ts) | 1-205 | All existing tests; add regression test here |
| P1 | [backend/src/forms/google-forms.service.ts](backend/src/forms/google-forms.service.ts) | 42-58 | batchUpdate caller — confirms itemId reaches the API verbatim |
| P2 | [logs.log](logs.log) | 17-26 | Production error: `q_1: Invalid ID` thrown by batchUpdate |

## External Documentation

| Topic | Key Takeaway |
|---|---|
| Google Forms API v1 batchUpdate | `itemId` in CreateItemRequest must be omitted on creation; Google auto-assigns numeric IDs. Supplying a custom string like "q_1" returns `Invalid ID`. |

---

## Patterns to Mirror

### NAMING_CONVENTION
```ts
// SOURCE: backend/src/forms/mapper.service.ts:47-51
function mapQuestion(
  question: Question,
  index: number,
  isQuizMode: boolean,
): GoogleFormsRequest {
```

### ERROR_HANDLING
```ts
// SOURCE: backend/src/forms/google-forms.service.ts:33-35
if (!formId) {
  throw new Error('Google Forms API did not return a formId');
}
```

### TEST_STRUCTURE
```ts
// SOURCE: backend/src/forms/mapper.service.spec.ts:28-34
describe('mapDslToGoogleRequests', () => {
  it('maps a single-page form to ordered items without page break', () => {
    const requests = mapDslToGoogleRequests(baseForm);
    expect(requests).toHaveLength(2);
  });
});
```

---

## Files to Change

| File | Action | Justification |
|---|---|---|
| `backend/src/forms/mapper.service.ts` | UPDATE | Remove `itemId` from both createItem paths in `mapQuestion()` |
| `backend/src/forms/mapper.service.spec.ts` | UPDATE | Add regression test verifying no `itemId` on any createItem |

## NOT Building

- Any change to `formId` handling (unrelated)
- Page break `itemId` removal (page breaks have no `itemId` already)
- Changes to quiz grading, image media, or page logic (all working)
- Google Forms API token refresh / auth changes

---

## Step-by-Step Tasks

### Task 1: Remove itemId from createItem in mapQuestion (choice path)

- **ACTION**: Delete `itemId: question.id,` from the choice question branch of `mapQuestion`
- **IMPLEMENT**: In `mapQuestion`, the `createItem.item` object (lines 71-88) has `itemId: question.id` — remove that line only
- **MIRROR**: Keep the rest of the object shape identical to current code
- **IMPORTS**: No new imports needed
- **GOTCHA**: `itemId` must be absent, not `undefined` — a partial spread with `undefined` still serialises as a key in some JSON libs. Simply delete the line.
- **VALIDATE**: `requests[0].createItem?.item` should not have an `itemId` key

### Task 2: Remove itemId from createItem in mapQuestion (text path)

- **ACTION**: Delete `itemId: question.id,` from the text question branch of `mapQuestion` (lines 93-108)
- **IMPLEMENT**: Same as Task 1 but in the else/text branch at line 95
- **MIRROR**: Keep all other fields unchanged
- **IMPORTS**: None
- **GOTCHA**: Same as Task 1 — delete the line, don't set to undefined
- **VALIDATE**: `requests[0].createItem?.item` for a short_answer question should not have an `itemId` key

### Task 3: Add regression test — no itemId on single-page form

- **ACTION**: Add a test that asserts no created item carries an `itemId`
- **IMPLEMENT**:
  ```ts
  it('does not set itemId on any createItem (Google API rejects non-numeric IDs)', () => {
    const requests = mapDslToGoogleRequests(baseForm);
    requests.forEach((req) => {
      expect(req.createItem?.item).not.toHaveProperty('itemId');
    });
  });
  ```
- **MIRROR**: Same `describe` block, same `baseForm` fixture — place after the existing image/video tests
- **IMPORTS**: None — `baseForm` already defined in file scope
- **GOTCHA**: Must test ALL requests so future page-break items are also covered
- **VALIDATE**: Test passes; prior tests still pass

### Task 4: Add regression test — no itemId on quiz + multi-page form

- **ACTION**: Add a second variant of the regression test covering quiz and multi-page
- **IMPLEMENT**:
  ```ts
  it('does not set itemId on quiz or multi-page forms', () => {
    const quizForm: Form = {
      ...baseForm,
      mode: 'quiz',
      pages: [
        {
          id: 'p1',
          title: 'Page 1',
          questions: [
            {
              id: 'q1',
              type: 'multiple_choice',
              title: 'Capital?',
              required: true,
              options: ['Rome', 'Paris'],
              correctAnswer: 'Rome',
              score: 2,
            },
          ],
        },
        {
          id: 'p2',
          title: 'Page 2',
          questions: [{ id: 'q2', type: 'short_answer', title: 'Open?', required: false }],
        },
      ],
    };
    const requests = mapDslToGoogleRequests(quizForm);
    // 3 items: q1, pageBreak before p2, q2
    expect(requests).toHaveLength(3);
    requests.forEach((req) => {
      expect(req.createItem?.item).not.toHaveProperty('itemId');
    });
  });
  ```
- **MIRROR**: Same pattern as Task 3; `Form` is already imported at the top of the spec file
- **IMPORTS**: None
- **GOTCHA**: Page break items are `{ title, pageBreakItem: {} }` — they never had `itemId`, but iterating them with `not.toHaveProperty` is safe and acts as a canary
- **VALIDATE**: All 3 items asserted, no itemId present

---

## Testing Strategy

### Unit Tests

| Test | Input | Expected Output | Edge Case? |
|---|---|---|---|
| No itemId on single-page form | baseForm | no `itemId` key on any item | No |
| No itemId on quiz + multi-page | quizForm with 2 pages | no `itemId` key on 3 items | No |
| Existing: grading in quiz mode | quiz form + correctAnswer + score | pointValue=2, correctAnswers=[{value:'Rome'}] | No |
| Existing: image media | question with media.type=image | imageItem.image.sourceUri set | No |
| Existing: page break | 2-page form | pageBreakItem at index 2, total 4 items | No |

### Edge Cases Checklist
- [x] Single page form — no itemId
- [x] Multi-page form — no itemId on page break items either
- [x] Quiz form — no itemId even when grading is present
- [x] Image/video media items — no itemId (these never had it, already safe)

---

## Validation Commands

### Unit Tests
```bash
cd backend && npm test -- --testPathPattern="mapper"
```
EXPECT: All tests pass (9 existing + 2 new = 11 total in mapper.service.spec.ts)

### Full Test Suite
```bash
cd backend && npm test
```
EXPECT: All 3 test suites, all tests pass, no regressions

### Type Check
```bash
cd backend && npx tsc --noEmit
```
EXPECT: Zero type errors

### Manual Validation
- [ ] Submit a minimal DSL payload to `POST /forms/create` with a valid Bearer token
- [ ] Confirm no 500 error — response returns `{ formId, formUrl }`
- [ ] Open the returned `formUrl` in a browser — form exists in Google Drive with expected questions

---

## Acceptance Criteria
- [ ] `itemId` field is absent from all `createItem.item` objects produced by `mapDslToGoogleRequests`
- [ ] Two new regression tests added and passing
- [ ] All 3 existing test suites still pass
- [ ] TypeScript compiles with zero errors

## Completion Checklist
- [ ] Removed `itemId: question.id` from choice question branch in `mapQuestion`
- [ ] Removed `itemId: question.id` from text question branch in `mapQuestion`
- [ ] Added regression test for single-page form (no itemId)
- [ ] Added regression test for quiz + multi-page form (no itemId)
- [ ] Ran full test suite — all pass
- [ ] Ran `tsc --noEmit` — zero errors

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Google Forms batchUpdate still fails after fix | Low | High | Verify with real token in staging; inspect other fields in request payload |
| Future developer re-adds itemId thinking it's needed | Medium | High | Regression tests in Tasks 3 and 4 catch it immediately |

## Notes

**Why was itemId added in the first place?** Likely to try to preserve round-trip DSL IDs for future reference. But the Google Forms API v1 only accepts `itemId` values it issued itself — you cannot supply your own on creation. If you need to correlate DSL IDs to Google IDs post-creation, read back the form after batchUpdate and match by question title/index.

**Requirements audit (all confirmed met in current code):**
- Quiz with points: `grading.pointValue` + `grading.correctAnswers` set when `mode === 'quiz'` and `correctAnswer` is present ✅
- Image URL on questions: `imageItem.image.sourceUri` inserted as a separate createItem after the question ✅
- Pages: `pageBreakItem` inserted before each page after the first, using the page title ✅
- No complex conditional logic / single flow only: branching logic is not implemented ✅
