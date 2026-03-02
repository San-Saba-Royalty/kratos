---
description: Full IAM lifecycle — orchestrates Design → Plan → Execute → Reflect → Assess → Diagnose → Fix → Validate
---

# IAM Full Lifecycle

This workflow orchestrates the complete Ory IAM skill suite. It runs the meta-controller
which routes you through all applicable phases.

## Step 1 — Load Meta-Controller

Read the meta-controller for phase routing and orchestration rules:

```
.agent/skills/ory-iam/prompts/meta-controller.md
```

## Step 2 — Load Core Knowledge Base

Read these files to establish baseline knowledge:

// turbo

```
.agent/skills/ory-iam/references/iam-best-practices.md
docs/desperate/skill-fixes-content-infrastructure/redirect-loop-patterns.md
docs/desperate/skill-fixes-content-infrastructure/pre-commit-checklist.md
```

## Step 3 — Check for Project Extensions

// turbo

```bash
ls docs/iam/ 2>/dev/null && echo "Extensions found — loading" || echo "No project extensions"
```

If `docs/iam/extensions.md` exists, read it for project-specific overrides.

## Step 4 — Determine Entry Point

Ask the user what they need:

1. **New implementation** — Start from DESIGN (Phase 1)
2. **Audit existing setup** — Jump to ASSESS (Phase 5)
3. **Fix a problem** — Jump to DIAGNOSE (Phase 6)
4. **Quick validation** — Jump to VALIDATE (Phase 9)

## Step 5 — Execute Phases

Follow the meta-controller's Phase Routing Table. For each phase:

1. Read the phase's `SKILL.md` from `.agent/skills/ory-iam/<phase>/SKILL.md`
2. Load any additional KB files listed for that phase
3. Execute the phase instructions
4. Write outputs to the specified state location
5. Transition to the next phase per the Flow Transitions diagram

## Step 6 — Finalize

After all phases complete:

1. Generate a topology report: `docs/infrastructure/topology-YYYY-MM-DD-HHmm.md`
2. Run pre-commit validation: `scripts/validate-infra.sh`
3. Run post-deploy tests (if deployed): `tests/infra/run-all.sh`
4. Commit and push
