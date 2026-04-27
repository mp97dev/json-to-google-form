# AGENTS.md — Angular Agents Implementation Guide

## 1. Purpose
Defines conventions and policies for using LLM-powered agents in this project.

## 2. Agent Scenarios

| Scenario | Description | Constraints |
|-----------|--------------|-------------|
| Developer Tooling | Codegen, lint fixes | Offline or sandboxed |
| CI Bots | Dependency updates | Deterministic, reviewed |
| Runtime Chat | In-app assistant | Validated, rate-limited |
| Background Agent | Batch summarization | Secure, cached |

## 3. Prompt Management
- Canonical prompt file: `ai/system-prompts.md`
- All prompts reference the canonical system instructions.
- Prompts must be reviewed and versioned with the codebase.

## 4. Agent Interfaces
```ts
interface AgentClient {
  invoke<TInput, TOutput>(task: string, input: TInput): Promise<AgentResponse<TOutput>>;
}
```

## 5. Validation & Fallbacks

* Validate output via schema or types.
* Fallback: human review → stub response → retry.

## 6. Caching

* Cache by `(task + contextHash)` key.
* Invalidate on project version change.

## 7. Testing & Quality

* Mock the LLM API for tests.
* Track metrics: latency, quality, cost.

## 8. Governance

* Prompt edits require PR + code owner review.
* Maintain version tags: `v1.0.0-prompts`.

## 9. Security

* No secrets in prompts.
* Redact user data before API call.

## 10. References

* [Angular AI Developer Guide](https://angular.dev/ai/develop-with-ai)
* [Web Codegen Scorer Tool](https://angular.dev/ai/develop-with-ai)

