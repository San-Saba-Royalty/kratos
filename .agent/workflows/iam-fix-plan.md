---
description: Convert DIAGNOSE findings into a specific fix task list with schema verification and test predictions
---

# IAM Fix Plan

Take the DIAGNOSE findings and produce a fix task list with exact changes.

## Step 1 — Load the FIX-PLAN Skill

Read `.agent/skills/ory-iam/fix-plan/SKILL.md` for the full protocol.

## Step 2 — Review Diagnosis

Read the diagnosis findings from the previous `/iam-diagnose` run.

## Step 3 — Generate Fix Tasks

Write `fix-plan/tasks.md` with one task per fix:

```
- [ ] File: <path>, Line: <N>
      Change: <exact description>
      Schema check: ✅/❌
      KB reference: <which KB entry validates this>
      Test: <which test from run-all.sh confirms it>
```

## Step 4 — Verify Changes Are Safe

For each fix:

- If it touches a Kratos config key → verify against v1.3.1 JSON schema
- If it touches Oathkeeper rules → check for OPTIONS, collisions
- If it touches Nginx → verify annotation format

## Step 5 — Next Phase

Proceed to `/iam-fix-exec` to apply the fixes.
