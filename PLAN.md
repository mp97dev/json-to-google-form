# Implementation Plan

This document breaks the project into clear, execution-ready phases.

## Phase 1 - Project Foundation

Goals:
- Set up a monorepo structure for `frontend`, `backend`, `cli`, `dsl`, and `docs`.
- Initialize backend (NestJS) and frontend (Angular) applications.
- Establish baseline tooling: linting, formatting, unit test runner, and CI pipeline.
- Add environment variable templates and configuration strategy.

Key tasks:
- Create folder structure and initial package/workspace configuration.
- Configure shared coding standards (ESLint, Prettier, TypeScript rules).
- Add CI workflow for lint + test on every push/PR.
- Define `.env.example` files for frontend and backend.

Deliverables:
- Repository boots locally with `dev`, `build`, and `test` commands.
- CI runs and reports lint/test status.

Exit criteria:
- New contributors can clone, install, and run the project in under 15 minutes.

## Phase 2 - DSL Specification and Validation

Goals:
- Define a strict, versioned JSON DSL schema (v1).
- Implement robust validation with AJV.
- Provide confidence through examples and tests.

Key tasks:
- Author JSON Schema for form metadata, sections, and item types.
- Enforce required fields, data types, and option constraints.
- Validate media-specific rules (image/video constraints).
- Create valid/invalid sample DSL files.
- Add unit tests for all validation rules and edge cases.

Deliverables:
- Stable DSL schema in `dsl/schema`.
- Validator module in backend with comprehensive tests.

Exit criteria:
- Invalid payloads fail deterministically with actionable error messages.

## Phase 3 - Mapping Engine (DSL -> Google Forms Requests)

Goals:
- Build a deterministic compiler from DSL into Google Forms API request payloads.
- Preserve ordering and section semantics.

Key tasks:
- Map sections to page-break logic.
- Map item types to correct Google Forms question types.
- Normalize field representations and defaults.
- Maintain explicit index/order handling.
- Add mapper unit tests and payload snapshot tests.

Deliverables:
- Pure mapping module independent from OAuth/UI.
- Test suite proving stable output for the same input.

Exit criteria:
- Given a valid DSL, mapper always produces valid, ordered API payloads.

## Phase 4 - Google Integration (OAuth + Forms Adapter)

Goals:
- Authenticate users with Google OAuth.
- Integrate with Google Forms API for form creation and updates.

Key tasks:
- Configure Google Cloud project and OAuth consent screen.
- Implement OAuth login flow and token handling.
- Build adapter methods for `create form` and `batch update`.
- Add retry/error handling around API calls.
- Implement integration tests with mocked Google APIs and optional live test profile.

Deliverables:
- Backend services for authenticated Google Forms operations.
- Working end-to-end form creation from validated mapper output.

Exit criteria:
- Authenticated user can create a form and receive a valid Google Form URL.

## Phase 5 - Backend API (MVP Endpoints)

Goals:
- Expose stable API endpoints for validation and form creation.
- Add operational safeguards and documentation.

Key tasks:
- Implement endpoints:
  - `POST /forms/validate`
  - `POST /forms/create`
- Add request validation and standardized error responses.
- Add rate limiting and input sanitization.
- Add structured logging and request correlation IDs.
- Publish OpenAPI/Swagger docs.

Deliverables:
- Production-ready MVP backend API.
- API docs for frontend/CLI integration.

Exit criteria:
- Consumers can integrate using documented contracts without code-level coordination.

## Phase 6 - Frontend Web App (Angular MVP)

Goals:
- Provide a simple UI to paste DSL, validate it, and generate forms.

Key tasks:
- Build JSON input editor (textarea first, Monaco optional).
- Implement `Validate` and `Generate Form` actions.
- Display validation errors in a readable format.
- Display generated Google Form link on success.
- Handle loading/error/success states.

Deliverables:
- Deployable Angular app for MVP flow.

Exit criteria:
- User can complete the entire flow (paste DSL -> validate -> generate -> open form URL) from the browser.

## Phase 7 - CLI Tool

Goals:
- Provide scriptable form creation through command line.

Key tasks:
- Implement `create-form <path-to-json>` command.
- Add local file parsing and input checks.
- Call validation and creation pipeline (direct or via backend).
- Print generated URL or actionable failure message.
- Add help text and exit codes.

Deliverables:
- Installable and documented CLI package.

Exit criteria:
- Users can generate forms non-interactively in local and CI workflows.

## Phase 8 - Quality, Security, and Observability

Goals:
- Raise reliability and operational readiness before broad rollout.

Key tasks:
- Expand automated tests (unit, integration, E2E).
- Add runtime metrics (latency, success/failure rates).
- Improve logging for debugging and traceability.
- Review token handling and security controls.
- Define basic SLOs and alerting thresholds.

Deliverables:
- QA/security checklist completed.
- Monitoring baseline available in deployed environments.

Exit criteria:
- Team can detect, triage, and recover from common production issues quickly.

## Phase 9 - Deployment and Release

Goals:
- Deploy frontend and backend to managed platforms.
- Validate real-world OAuth and API behavior in production-like environments.

Key tasks:
- Deploy backend (e.g., Railway/Render/Firebase Functions).
- Deploy frontend (e.g., Vercel/Netlify).
- Configure environment variables and OAuth redirect URIs.
- Run smoke tests post-deploy.
- Document rollback and incident response basics.

Deliverables:
- Publicly accessible MVP deployment.
- Deployment and operations runbook.

Exit criteria:
- Production deployment is repeatable and stable.

## Phase 10 - Post-MVP Enhancements

Goals:
- Extend product capability beyond core MVP.

Candidate enhancements:
- LLM prompt-to-DSL generator with strict JSON output.
- Live form preview from DSL.
- Template library and reusable snippets.
- Versioning and diff-based update model.
- Multi-provider support (future adapters).

Deliverables:
- Prioritized roadmap with impact/effort estimates.

Exit criteria:
- Next release scope is selected with clear ownership and timelines.

## Suggested Timeline (High Level)

- Weeks 1-2: Phases 1-2
- Weeks 3-4: Phases 3-5
- Weeks 5-6: Phases 6-7
- Week 7: Phase 8
- Week 8: Phase 9
- Ongoing: Phase 10

## Dependencies Summary

- Phase 2 depends on Phase 1.
- Phase 3 depends on Phase 2.
- Phase 4 depends on Phases 1 and 3.
- Phase 5 depends on Phases 2-4.
- Phase 6 and Phase 7 depend on Phase 5.
- Phase 8 runs in parallel but should complete before full rollout.
- Phase 9 depends on Phases 6-8.

## Risks and Mitigations

- OAuth complexity and consent screen delays:
  - Mitigation: set up Google Cloud early in Phase 4 with test users first.
- Google Forms API limitations (media/update behavior):
  - Mitigation: codify constraints in DSL validator and mapper tests.
- Schema drift between frontend, CLI, and backend:
  - Mitigation: centralize DSL schema and share validation contract.
- Regressions in mapping logic:
  - Mitigation: snapshot tests plus golden input/output fixtures.

## Definition of MVP Done

The MVP is complete when:
- A user can provide valid JSON DSL via web app or CLI.
- The system validates and compiles the DSL deterministically.
- The backend creates a Google Form using authenticated API calls.
- The user receives and can open a working Google Form URL.
- Core quality gates (lint, tests, smoke checks) pass in CI.
