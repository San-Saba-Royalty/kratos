---
name: ory-iam-execute
description: Execute the task list from PLAN with mandatory schema validation at every step
---

# EXECUTE Sub-Skill

## Purpose

Work through the PLAN task list. Every config change must pass validation before commit.

## Theory, Strategy & Thinking Patterns

> **THEORY**: Execution is the manual labor of realizing the plan. It requires absolute strictness. Identity infrastructure is unforgiving; a single typo in a YAML block exposes the application or breaks login globally.
>
> **STRATEGY**: **Atomic Application and Immediate Validation**. Never apply multiple theoretical layers at once. Write the Oathkeeper rule -> Execute OpenTofu -> Validate. Write the Kratos Configmap -> Apply -> Validate.
>
> **THINKING PATTERNS**:
>
> 1. **The 'Source-Truth' Check**: Before writing a key, mentally confirm: "Did I check this against `kratos-source-truth-config.md`?". The source Go structs are the only truth.
> 2. **Blast Radius Minimization**: Assume every `apply` command will fail. How do you roll back? Kratos ConfigMaps are safer to patch than tearing down the StatefulSet.
> 3. **The Silent Failure Mindset**: Oathkeeper rules failing validation doesn't crash Oathkeeper; it silently drops the rule and leaves the endpoint unprotected or inaccessible. You must actively check the Oathkeeper pod logs for rule hydration errors.

## Hard Rules

1. **Before writing any Kratos config key:** Open `docs/desperate/skill-fixes-content-infrastructure/kratos-v1.3-config-schema.md` (or the JSON schema) and verify the key exists
2. **Before writing any Oathkeeper access rule:** Check `oathkeeper-multi-app-cors.md` for:
   - No OPTIONS in methods
   - No rule collision with existing rules
   - Login/register routes use `anonymous` authenticator
3. **After every file change:** Run `scripts/validate-infra.sh`
4. **After every batch of changes:** Run `tofu validate`
5. **Never commit without:** A dated topology report in `docs/infrastructure/`
6. **Cookie proxy:** NEVER rewrite cookies unconditionally in production

## Workflow

```
For each task in plan/tasks.md:
  1. Make the code/config change
  2. Run: scripts/validate-infra.sh
     - If FAIL → fix before continuing
  3. Run: tofu validate
     - If FAIL → fix before continuing
  4. Mark task as complete
  5. Move to next task
After all tasks complete:
  6. Generate topology report
  7. Commit and push
```
