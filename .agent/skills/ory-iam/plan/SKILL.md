---
name: ory-iam-plan
description: Analyze spec + code + knowledge base to generate a verified task list
---

# PLAN Sub-Skill

## Purpose

Consume the DESIGN spec, analyze source code, and generate a task list that accounts for
every known issue in the knowledge base.

## Theory, Strategy & Thinking Patterns

> **THEORY**: A plan is not a suggestion; it is a compiled binary of intentions. You are translating the abstract `spec` from the Design phase into deterministic infrastructure code.
>
> **STRATEGY**: **Task Isolation & Deterministic Prediction**. Every change to Kratos or Oathkeeper must be isolated. If you change a Kratos setting and an Oathkeeper rule simultaneously without a validation boundary, you cannot determine which component failed.
>
> **THINKING PATTERNS**:
>
> 1. **Schema is Law**: If an intent requires modifying Kratos, the exact Viper key (e.g., `session.whoami.required_aal`) must trace linearly back to `driver/config/config.go`. Guessing keys results in CrashLoopBackOffs.
> 2. **Rule Non-Overlap**: Oathkeeper evaluates rules heuristically based on matching strategy. The plan must guarantee that new access rules do not shadow or completely override existing rules. Specificity always wins.
> 3. **Constraint Resolution**: Compare the spec against the Knowledge Base. If the plan involves a proxy, the proxy logic must perfectly match the constraints documented in the KB (e.g., preserving `X-Forwarded-Proto`).

## Inputs

- Spec files from DESIGN phase
- Source code of all apps in the topology
- Knowledge base at `docs/desperate/skill-fixes-content-infrastructure/`

## Process

1. **Parse spec:** Extract every ingress, access rule, Kratos config section needed
2. **Scan knowledge base:** For each planned config change, check against known issues:
   - Does this config key exist in the Kratos v1.3.1 schema?
   - Does this access rule pattern conflict with existing rules?
   - Does this CORS configuration create duplicate headers?
   - Does this cookie strategy trigger a known redirect loop pattern?
3. **Generate task list** with these mandatory items:
   - [ ] Every TF resource to create/modify (with file path)
   - [ ] Every access rule to write (with handler justification)
   - [ ] Every Kratos config section to set (with schema verification)
   - [ ] Pre-commit checklist step
   - [ ] Topology report generation step
   - [ ] Post-deploy validation step

## Outputs

- `plan/tasks.md` — ordered task list with schema verification notes
- `plan/known-issues-applied.md` — which KB entries are relevant to this plan

## Validation

Before proceeding to EXECUTE: task list must include a `validate-infra.sh` step and a `run-all.sh` step.
