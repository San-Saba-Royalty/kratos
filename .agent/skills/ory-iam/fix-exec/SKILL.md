---
name: ory-iam-fix-exec
description: Execute fix tasks with the same validation rules as EXECUTE
---

# FIX-EXEC Sub-Skill

## Purpose

Apply fixes from FIX-PLAN. Same rules as EXECUTE — every change must pass validation.

## Theory, Strategy & Thinking Patterns

> **THEORY**: Fixing production infrastructure is performing surgery on a running engine. The prime directive is: do no further harm.
>
> **STRATEGY**: **Safe Application via Isolation constraint**. A fix that fails validation means the diagnostic hypothesis was wrong, or the execution was incomplete.
>
> **THINKING PATTERNS**:
>
> 1. **The Rollback Imperative**: If a fix fails its validation test, you do *not* stack more fixes on top, and you do *not* commit. You immediately `git restore` the file and revert to the known bad state before returning to DIAGNOSE.
> 2. **Truth Enforcement**: Even if FIX-PLAN told you to write a config key, FIX-EXEC must re-verify that key against the source-truth reference guide before running OpenTofu. Never assume the plan is flawless.

## Rules (identical to EXECUTE)

1. Before writing any Kratos config key: verify it exists in the JSON schema
2. Before writing any Oathkeeper rule: check for OPTIONS, collisions, handler validity
3. After every file change: run `scripts/validate-infra.sh`
4. After every batch: run `tofu validate`
5. Never commit without a topology report

## Workflow

```
For each task in fix-plan/tasks.md:
  1. Apply the fix
  2. Run: scripts/validate-infra.sh → must pass
  3. Run: tofu validate → must pass
  4. Mark task complete
After all fixes:
  5. Generate topology report
  6. Commit and push
  7. Proceed to VALIDATE
```

## Critical: Do NOT Stack Fixes

If `validate-infra.sh` fails after applying a fix, do NOT add more fixes.
Revert the failed fix, return to DIAGNOSE with the new error.
