---
description: Assess IAM compliance and health against 50+ best practice items with a scored report
---

# IAM Assess

Systematic evaluation of an existing IAM deployment against documented best practices.

## Step 1 — Load the ASSESS Skill

Read `.agent/skills/ory-iam/assess/SKILL.md` for the full protocol.

## Step 2 — Load Best Practices Reference

// turbo
Read `.agent/skills/ory-iam/references/iam-best-practices.md` — the canonical 50+ item checklist.

## Step 3 — Load Project Extensions

// turbo
If `docs/iam/extensions.md` exists, read it for additional project-specific checklist items.

## Step 4 — Run Automated Checks

// turbo

```bash
scripts/validate-infra.sh
```

If cluster access is available:

```bash
tests/infra/run-all.sh
```

## Step 5 — Static Analysis

For each checklist item, analyze the relevant config files:

- `k8s/opentofu/kratos.tf`
- `k8s/opentofu/templates/access-rules.yml.tpl`
- `k8s/opentofu/templates/oathkeeper.yml.tpl`
- `k8s/opentofu/ingress.tf`
- Application middleware and proxy routes

## Step 6 — Score and Report

Produce `assess/report-YYYY-MM-DD.md` with:

- Overall score (out of 100)
- CRITICAL/HIGH/MEDIUM/LOW findings count
- Per-category compliance matrix
- Priority-ordered recommendations

## Step 7 — Next Phase

If CRITICAL findings → proceed to `/iam-diagnose` with findings.
If all clear → deployment is healthy.
