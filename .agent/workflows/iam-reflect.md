---
description: Post-deploy analysis comparing IAM spec vs actual deployment, documenting pitfalls avoided
---

# IAM Reflect

Run AFTER deployment. Compares what was designed vs what was deployed.

## Step 1 — Load the REFLECT Skill

Read `.agent/skills/ory-iam/reflect/SKILL.md` for the full protocol.

## Step 2 — Load Spec and State

Read the DESIGN spec (`spec/`) and the latest topology report (`docs/infrastructure/`).

## Step 3 — Compare Spec vs Actual

For each item in the spec:

- ✅ Match — deployed config matches spec
- ⚠️ Deviation — different from spec, with justification
- 🔴 Missing — spec item not implemented

## Step 4 — Load KB for Pitfall Review

// turbo
Read `docs/desperate/skill-fixes-content-infrastructure/redirect-loop-patterns.md`

For each KB entry, document whether it was:

- 📋 Applicable and successfully avoided
- ❌ Applicable but NOT avoided (needs fix)
- ➖ Not applicable to this deployment

## Step 5 — Produce Report

Write `reflect/report.md` with all findings, deviations, and lessons learned.

## Step 6 — Next Phase

If discrepancies found → proceed to `/iam-diagnose`.
If clean → proceed to `/iam-assess` for full compliance scoring.
