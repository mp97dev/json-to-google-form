# Implementation Report: Fix Form Creation — Invalid itemId in batchUpdate

## Summary
Removed `itemId: question.id` from both createItem paths in `mapQuestion()` in `mapper.service.ts`. Google Forms API v1 rejects non-numeric `itemId` values (e.g. `"q_1"`) on creation; omitting it lets Google auto-assign valid numeric IDs. Added two regression tests to prevent reintroduction.

## Assessment vs Reality

| Metric | Predicted (Plan) | Actual |
|---|---|---|
| Complexity | Small | Small |
| Confidence | High | High |
| Files Changed | 2 | 2 |

## Tasks Completed

| # | Task | Status | Notes |
|---|---|---|---|
| 1 | Remove itemId from choice question branch | done | Deleted `itemId: question.id` from choice path |
| 2 | Remove itemId from text question branch | done | Deleted `itemId: question.id` from text path |
| 3 | Add regression test — no itemId on single-page form | done | |
| 4 | Add regression test — no itemId on quiz + multi-page form | done | |

## Validation Results

| Level | Status | Notes |
|---|---|---|
| Static Analysis (tsc) | Pass | Zero type errors |
| Unit Tests (mapper) | Pass | 12 tests (10 pre-existing + 2 new) |
| Unit Tests (all src/) | Pass | 21 tests across 3 suites |
| Build | N/A | Not required for this fix |
| Integration | N/A | Integration tests require live server; pre-existing timeout |
| Edge Cases | Pass | quiz mode, multi-page, page breaks all covered |

## Files Changed

| File | Action | Notes |
|---|---|---|
| `backend/src/forms/mapper.service.ts` | UPDATED | Removed 2 `itemId` lines |
| `backend/src/forms/mapper.service.spec.ts` | UPDATED | Added 2 regression tests |

## Deviations from Plan
None — implemented exactly as planned.

## Issues Encountered
Full `npm test` timed out (exit 143) because integration tests in `test/` hang waiting for a live NestJS + Google API server. This is pre-existing behavior unrelated to this fix. All `src/` unit tests (3 suites, 21 tests) pass cleanly.

## Tests Written

| Test File | Tests | Coverage |
|---|---|---|
| `backend/src/forms/mapper.service.spec.ts` | 2 new tests | No itemId on single-page; no itemId on quiz/multi-page |

## Next Steps
- [ ] Code review via `/code-review`
- [ ] Create PR via `/prp-pr`
- [ ] Manual validation: POST a DSL payload to `/forms/create` with a real Bearer token and confirm `{ formId, formUrl }` returns without 500
