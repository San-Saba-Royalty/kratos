---
name: ory-iam-fix-plan
description: Convert DIAGNOSE output into a specific, verified fix task list
---

# FIX-PLAN Sub-Skill

## Purpose

Take the DIAGNOSE findings and produce a fix task list with exact changes, schema verification, and expected test outcomes.

## Theory, Strategy & Thinking Patterns

> **THEORY**: A diagnostic conclusion is only theoretical until it is converted into a deterministic remediating action.
>
> **STRATEGY**: **Surgical Remediation Strategy**. Fixes must be entirely isolated. If you change a Kratos setting *and* an Nginx annotation in the same task without disjoint validation, you destroy the diagnostic isolation.
>
> **THINKING PATTERNS**:
>
> 1. **Schema Sovereignty**: Never plan a fix based on an internet snippet. Plan fixes based strictly on the compiled Go source code structs documented in `kratos-source-truth-config.md` and `oathkeeper-source-truth-config.md`.
> 2. **Predictive Validity**: A plan must declare its expected outcome before execution. "If I change this key, Test 05 will change from 403 to 200." If you cannot predict the test outcome, your fix is a blind guess.
> 3. **Minimize Cognitive Debt**: A fix task must explicitly state why the change works. Do not say "Remove trusted_proxies"; say "Remove `trusted_proxies` because it is an invalid Viper key in `config.go` and triggers CrashLoopBackOff."

## Inputs

- DIAGNOSE findings (layer, file, line, root cause)

## Process

1. **Identify the exact change:** file path, line number, current value, new value
2. **Schema verification:** If the fix involves a Kratos config key, verify against JSON schema
3. **Collision check:** If the fix involves Oathkeeper rules, check for collisions
4. **Test prediction:** Which test from `tests/infra/run-all.sh` will confirm the fix?

## Output

`fix-plan/tasks.md`:

```
- [ ] File: k8s/opentofu/kratos.tf, Line: 23
      Change: Remove `trusted_proxy_ip_cidrs` (not valid in v1.3.1)
      Schema check: ✅ Key does not exist in schema (additionalProperties violation)
      Test: test-01 (Kratos health) should return 200 instead of CrashLoopBackOff

- [ ] File: k8s/opentofu/ingress.tf, Line: 88
      Change: Add configuration-snippet with X-Forwarded-Proto: https
      Test: test-05 (login flow fetch) should return 200 instead of 403
```

## Rules

- One fix per task. Do not combine multiple fixes.
- Each task must cite which knowledge base entry validates it.
- Each task must predict which test will confirm it.
