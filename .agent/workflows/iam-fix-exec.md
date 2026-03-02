---
description: Apply IAM fixes from the fix task list with mandatory validation at every step
---

# IAM Fix Execute

Apply fixes from FIX-PLAN. Same rules as EXECUTE — every change must pass validation.

## Step 1 — Load the FIX-EXEC Skill

Read `.agent/skills/ory-iam/fix-exec/SKILL.md` for the full protocol.

## Step 2 — Load Fix Task List

Read `fix-plan/tasks.md` produced by `/iam-fix-plan`.

## Step 3 — Apply Fixes

For EACH task:

1. Apply the fix
2. Run validation:
// turbo

```bash
scripts/validate-infra.sh
```

3. If FAIL → REVERT the fix, return to `/iam-diagnose` with the new error. Do NOT stack fixes.
2. Mark task as complete

## Step 4 — Post-Fix Validation

// turbo

```bash
cd k8s/opentofu && /opt/homebrew/bin/tofu validate
```

## Step 5 — Generate Topology Report

Generate `docs/infrastructure/topology-YYYY-MM-DD-HHmm.md`.

## Step 6 — Commit and Proceed

Commit all changes with the topology report, then proceed to `/iam-validate`.
