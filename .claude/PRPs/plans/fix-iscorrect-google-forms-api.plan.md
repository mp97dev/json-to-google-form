# Plan: Fix `isCorrect` Invalid Field in Google Forms API Payload

## Summary
When creating a quiz-mode form, the mapper sends `isCorrect: true` inside each `choiceQuestion.options` object. The Google Forms API v1 does not recognise this field and rejects the entire `batchUpdate` request with HTTP 400/500. The correct answer is already conveyed through the `grading.correctAnswers` field, so `isCorrect` on the option is both wrong and redundant.

## User Story
As a teacher using the app, I want to create a quiz Google Form from a JSON description so that my students can take it online with automatic grading.

## Problem → Solution
`batchUpdate` fails with `Unknown name "isCorrect"` → strip `isCorrect` from every `choiceQuestion.options` entry before the request is sent.

## Metadata
- **Complexity**: Small
- **Source PRD**: N/A
- **PRD Phase**: N/A
- **Estimated Files**: 1 (mapper.service.ts) — plus its type interface and spec

---

## UX Design

N/A — internal change; user-visible effect is that form creation succeeds instead of returning HTTP 500.

---

## Mandatory Reading

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 (critical) | `backend/src/forms/mapper.service.ts` | 1-92 | Contains the bug and the `GoogleFormsRequest` type |
| P1 (important) | `backend/src/forms/mapper.service.spec.ts` | 76-102 | Existing quiz-mode grading test to extend |

---

## Patterns to Mirror

### NAMING_CONVENTION
```typescript
// SOURCE: backend/src/forms/mapper.service.ts:59
const mappedOptions = options.map((opt) => ({ value: opt }));
```

### TEST_STRUCTURE
```typescript
// SOURCE: backend/src/forms/mapper.service.spec.ts:76-102
it('adds grading info in quiz mode', () => {
  // ...
  const grading = requests[0].createItem?.item.questionItem?.question.grading;
  expect(grading?.pointValue).toBe(3);
  expect(grading?.correctAnswers.answers[0].value).toBe('Rome');
});
```

---

## Files to Change

| File | Action | Justification |
|---|---|---|
| `backend/src/forms/mapper.service.ts` | UPDATE | Remove `isCorrect` from mapped options (line 61) and from the `GoogleFormsRequest` interface (line 13) |
| `backend/src/forms/mapper.service.spec.ts` | UPDATE | Add assertion that quiz-mode options do NOT contain `isCorrect` |

## NOT Building
- Any change to grading logic — it already works correctly via `grading.correctAnswers`
- Any change to non-quiz-mode behaviour
- Any UI changes

---

## Step-by-Step Tasks

### Task 1: Remove `isCorrect` from mapped options
- **ACTION**: Edit `mapQuestion` in `backend/src/forms/mapper.service.ts`
- **IMPLEMENT**: Change lines 59-62 from spreading `isCorrect` to simply mapping `{ value: opt }`:
  ```typescript
  // BEFORE
  const mappedOptions = options.map((opt) => ({
    value: opt,
    ...(isQuizMode && question.correctAnswer === opt ? { isCorrect: true } : {}),
  }));

  // AFTER
  const mappedOptions = options.map((opt) => ({ value: opt }));
  ```
- **MIRROR**: Simplest map — no extra fields
- **GOTCHA**: The correct answer is already in `grading.correctAnswers.answers[0].value` (lines 64-70). Removing `isCorrect` does not affect grading — it only removes the field that the API rejects.
- **VALIDATE**: The `batchUpdate` request body will no longer contain `"isCorrect"` in any options object.

### Task 2: Clean up the `GoogleFormsRequest` interface
- **ACTION**: Remove `isCorrect?: boolean` from the `options` type in the `GoogleFormsRequest` interface at the top of `mapper.service.ts`
- **IMPLEMENT**: Change line 13:
  ```typescript
  // BEFORE
  options: { value: string; isCorrect?: boolean }[];

  // AFTER
  options: { value: string }[];
  ```
- **MIRROR**: Type matches exactly what the API accepts
- **GOTCHA**: If any other code references `isCorrect` on this type it will become a type error — that is intentional; fix any such callsite too.
- **VALIDATE**: `npx tsc --noEmit` reports zero errors.

### Task 3: Add a regression test
- **ACTION**: Add a test to `mapper.service.spec.ts` asserting options never contain `isCorrect`
- **IMPLEMENT**: Add after the existing "adds grading info in quiz mode" test:
  ```typescript
  it('does not include isCorrect in quiz mode options', () => {
    const form: Form = {
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
            },
          ],
        },
      ],
    };
    const requests = mapDslToGoogleRequests(form);
    const opts = requests[0].createItem?.item.questionItem?.question.choiceQuestion?.options ?? [];
    opts.forEach((opt) => {
      expect(opt).not.toHaveProperty('isCorrect');
    });
  });
  ```
- **MIRROR**: Same form fixture style as "adds grading info in quiz mode" (lines 77-102 of spec)
- **GOTCHA**: Use `not.toHaveProperty` to check for absence of the key, not just a falsy value.
- **VALIDATE**: `npm test -- --testPathPattern=mapper` passes with all tests green.

---

## Testing Strategy

### Unit Tests

| Test | Input | Expected Output | Edge Case? |
|---|---|---|---|
| quiz mode options have no `isCorrect` | quiz form with `correctAnswer` | each option object has only `value` | No |
| grading block still present | quiz form with `correctAnswer` | `grading.correctAnswers.answers[0].value` matches | No |
| non-quiz mode unchanged | mode=form | options have only `value`, no grading | No |

### Edge Cases Checklist
- [x] Quiz mode with `correctAnswer` set — options must be `{value}` only
- [x] Quiz mode without `correctAnswer` — grading is `undefined`, options still `{value}` only
- [x] Non-quiz (form) mode — options unchanged, grading absent

---

## Validation Commands

### Type Check
```bash
cd /workspaces/json-to-google-form/backend && npx tsc --noEmit
```
EXPECT: Zero type errors

### Unit Tests
```bash
cd /workspaces/json-to-google-form/backend && npm test -- --testPathPattern=mapper
```
EXPECT: All tests pass including new regression test

### Full Test Suite
```bash
cd /workspaces/json-to-google-form/backend && npm test
```
EXPECT: No regressions

---

## Acceptance Criteria
- [ ] Task 1 complete: `isCorrect` removed from `mappedOptions`
- [ ] Task 2 complete: `GoogleFormsRequest` options type cleaned up
- [ ] Task 3 complete: regression test added and green
- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] Full test suite passes
- [ ] A real Google Forms `batchUpdate` call with a quiz form succeeds (no `Unknown name "isCorrect"` error)

## Completion Checklist
- [ ] No `isCorrect` appears anywhere in the `batchUpdate` request body
- [ ] Grading (`correctAnswers`) is still present in quiz mode
- [ ] No unrelated code changed

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Some other callsite depended on `isCorrect` in options | Very low | Build error | `tsc --noEmit` catches it immediately |
| Grading accidentally removed | Very low | Quiz answers not marked | Existing grading test catches it |

## Notes
The Google Forms API v1 uses `grading.correctAnswers.answers[{value}]` to identify correct answers — NOT `isCorrect` on the option. The `isCorrect` field was likely added based on an incorrect assumption about the API schema. Removing it is safe because the grading block already contains the correct answer.
