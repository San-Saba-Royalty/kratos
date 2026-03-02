---
name: ory-iam-validate
description: Run all 14 automated infrastructure tests and confirm green
---

# VALIDATE Sub-Skill

## Purpose

Run the full automated test suite after deployment. Every test must pass.

## Theory, Strategy & Thinking Patterns

> **THEORY**: The plan is the concept; the deployment is the execution; validation is the absolute mathematical proof.
>
> **STRATEGY**: **Binary Outcomes & Refusal to Compromise**. In identity and access management, there are no "minor" test failures.
>
> **THINKING PATTERNS**:
>
> 1. **Never Rationalize a Failure**: If a CSRF cookie test fails, do not assume it's just "because of the test environment." It means the cookie domain or `Secure` flag is wrong, which will break the production login.
> 2. **Failure is a Pipeline Halt**: If ONE of the 14 tests fails, the whole CI/CD process halts. Do not stack more fixes. Immediately shift the mindset back to `DIAGNOSE` and treat the failing test output as the raw error log.

## Process

```bash
# Run all 14 tests
./tests/infra/run-all.sh
```

## Expected Results

All 14 tests must pass:

- Group A (Health): 3 tests — Kratos, Oathkeeper, backend alive
- Group B (CSRF): 3 tests — login flow, CSRF cookie domain
- Group C (Redirect): 3 tests — no loops detected
- Group D (CORS/SignalR): 3 tests — preflight + negotiate
- Group E (JWT): 1 test — JWKS endpoint
- Group F (SMTP): 1 test — courier URI correct

## On Failure

If ANY test fails:

1. Read the failing test's output carefully
2. Do NOT add more fixes or re-run hoping it works
3. Return to DIAGNOSE (Skill 5) with the EXACT error from the failing test
4. The failing test output replaces the `kubectl logs` in DIAGNOSE Step 1

## On Success

All 14 green → deployment is verified. Return to REFLECT for post-mortem.
