---
description: Run all 14 automated IAM infrastructure tests and validate the deployment
---

# IAM Validate

Run the full automated test suite. Every test must pass.

## Step 1 — Load the VALIDATE Skill

Read `.agent/skills/ory-iam/validate/SKILL.md` for the full protocol.

## Step 2 — Run Automated Tests

// turbo

```bash
tests/infra/run-all.sh
```

## Step 3 — Evaluate Results

All 14 tests must pass:

- Group A (Health): Kratos, Oathkeeper, backend
- Group B (CSRF): login flow, cookie domain
- Group C (Redirect): no loops detected
- Group D (CORS/SignalR): preflight + negotiate
- Group E (JWT): JWKS endpoint
- Group F (SMTP): courier URI

## Step 4 — On Failure

If ANY test fails:

1. Read the failing test's output
2. Do NOT re-run hoping it works
3. Return to `/iam-diagnose` with the EXACT error

## Step 5 — On Success

All 14 green → deployment verified. Run `/iam-reflect` for post-mortem if not already done.
