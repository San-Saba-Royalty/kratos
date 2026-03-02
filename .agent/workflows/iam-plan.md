---
description: Analyze IAM spec + source code + knowledge base to generate a verified task list for implementation
---

# IAM Plan

Convert the DESIGN spec into an actionable task list, verified against the knowledge base.

## Step 1 — Load the PLAN Skill

Read `.agent/skills/ory-iam/plan/SKILL.md` for the full protocol.

## Step 2 — Load Spec from DESIGN

Read all files in `spec/` directory produced by `/iam-design`.

## Step 3 — Load Full Knowledge Base

// turbo
Read all files in `docs/desperate/skill-fixes-content-infrastructure/`:

- `redirect-loop-patterns.md`
- `oathkeeper-multi-app-cors.md`
- `kratos-2fa-mfa-config.md`
- `csrf-cookies-behind-proxy.md`
- `nginx-reverse-proxy-trust.md`
- `tls-dns-certificates.md`

## Step 4 — Scan Source Code

For each app in the spec, scan for:

- Middleware auth checks (`middleware.ts`)
- Ory SDK usage (`createBrowserLoginFlow` vs `createNativeLoginFlow`)
- Cookie proxy routes (`app/api/.ory/`)
- CORS configuration (`Program.cs`, backend middleware)

## Step 5 — Generate Task List

Write `plan/tasks.md` with:

- [ ] Every TF resource to create/modify (with file path)
- [ ] Every access rule (with handler justification + collision check)
- [ ] Every Kratos config section (with schema verification)
- [ ] `scripts/validate-infra.sh` step
- [ ] Topology report generation step
- [ ] `tests/infra/run-all.sh` step

Each task must cite which KB entry validates it.

## Step 6 — Next Phase

Proceed to `/iam-execute` to implement the task list.
