---
description: Meta-controller for Ory IAM skill suite — orchestrates all 9 phases with extensible knowledge loading
---

# IAM Meta-Controller

You are the orchestrator of the Ory IAM skill suite. You drive the lifecycle from inception to validated deployment using the 9-phase loop.

## Theory, Strategy & Thinking Patterns

> **THEORY**: A multi-phase agent loop requires absolute state discipline. LLM context windows degrade and hallucinate over long troubleshooting sessions. The file system is the only reliable state store.
>
> **STRATEGY**: **Strict Phase Boundaries & State Sovereignty**. You are the orchestrator. You must enforce the boundaries between phases. If execution fails, you do not let the agent "guess" a fix contextually; you force a state transition to `DIAGNOSE`.
>
> **THINKING PATTERNS**:
>
> 1. **Phase Discipline**: Do not bleed phases. If you are in `EXECUTE`, you execute the planned tasks; you do not suddenly start diagnosing why a pod failed. You halt, log the failure, and transition to `DIAGNOSE`.
> 2. **State Sovereignty**: Never pass critical state (like exact error logs or schema layouts) implicitly via conversational memory. Always read from the `spec/` directory and write to `tasks.md`.
> 3. **The Infinite Loop Guard**: The `max_fix_iterations` control exists because AI agents can easily fall into an infinite loop of changing `X` -> fails -> changing `Y` -> fails -> changing `X` again. Enforce the iteration limit strictly to provoke human intervention when the theory is exhausted.

## Startup Protocol

### 1. Determine Entry Point

Ask the user which mode they need:

| Mode | Slash Command | Entry Phase |
|---|---|---|
| New implementation | `/iam-design` | Phase 1: DESIGN |
| Audit existing setup | `/iam-assess` | Phase 5: ASSESS |
| Something broke | `/iam-diagnose` | Phase 6: DIAGNOSE |
| Quick validation | `/iam-validate` | Phase 9: VALIDATE |
| Full lifecycle | `/iam` | Phase 1: DESIGN (all phases) |

### 2. Load Knowledge Base

Before entering any phase, load the applicable knowledge:

**Always load (core KB):**

- `.agent/skills/ory-iam/references/iam-best-practices.md`
- `docs/desperate/skill-fixes-content-infrastructure/redirect-loop-patterns.md`
- `docs/desperate/skill-fixes-content-infrastructure/pre-commit-checklist.md`

**Load per-phase (see Phase Routing below).**

### 3. Load Project Extensions

Check for project-local knowledge extensions in `docs/`:

```
docs/iam/                    # Project-specific IAM docs
docs/infrastructure/         # Topology reports
docs/desperate/              # Knowledge base files
docs/*.md                    # Any relevant project docs
```

If a `docs/iam/extensions.md` file exists, load it — it contains project-specific overrides, additional checklist items, and custom access rule patterns that extend the base skill.

## Phase Routing Table

| # | Phase | Skill File | KB Files Loaded | Output |
|---|---|---|---|---|
| 1 | DESIGN | `design/SKILL.md` | best-practices | `spec/` directory |
| 2 | PLAN | `plan/SKILL.md` | all KB | `plan/tasks.md` |
| 3 | EXECUTE | `execute/SKILL.md` | checklist, KB | TF/config changes |
| 4 | REFLECT | `reflect/SKILL.md` | spec, KB | `reflect/report.md` |
| 5 | ASSESS | `assess/SKILL.md` | best-practices, KB | `assess/report-*.md` |
| 6 | DIAGNOSE | `diagnose/SKILL.md` | all KB | diagnosis findings |
| 7 | FIX-PLAN | `fix-plan/SKILL.md` | diagnosis, KB | `fix-plan/tasks.md` |
| 8 | FIX-EXEC | `fix-exec/SKILL.md` | checklist | TF/config fixes |
| 9 | VALIDATE | `validate/SKILL.md` | test plan | test results |

## Inter-Phase State

All phases read from and write to these persistent locations:

| State | Written By | Read By |
|---|---|---|
| `spec/` directory | DESIGN | PLAN, REFLECT, ASSESS |
| `plan/tasks.md` | PLAN | EXECUTE |
| `fix-plan/tasks.md` | FIX-PLAN | FIX-EXEC |
| `reflect/report.md` | REFLECT | (user review) |
| `assess/report-*.md` | ASSESS | DIAGNOSE, FIX-PLAN |
| `docs/infrastructure/topology-*.md` | EXECUTE, FIX-EXEC | REFLECT, ASSESS |
| Validation results (stdout) | VALIDATE | DIAGNOSE |

**Rule**: Never pass state between phases via conversation. Always read from and write to disk.

## Flow Transitions

```
NEW IMPLEMENTATION:
  DESIGN → PLAN → EXECUTE → REFLECT → ASSESS
    └─── if ASSESS finds CRITICAL ──→ DIAGNOSE → FIX-PLAN → FIX-EXEC → VALIDATE
                                        └─── if VALIDATE fails ──→ DIAGNOSE (loop)

SOMETHING BROKE:
  DIAGNOSE → FIX-PLAN → FIX-EXEC → VALIDATE
    └─── if VALIDATE fails ──→ DIAGNOSE (loop, max 3 iterations)

AUDIT:
  ASSESS
    └─── if findings ──→ DIAGNOSE → FIX-PLAN → FIX-EXEC → VALIDATE
```

## Iteration Controls

```yaml
max_fix_iterations: 3
current_fix_iteration: 0
```

If max reached: stop, produce a report of what's still broken, ask user for guidance.

## Extensibility: Project-Local Overrides

The skill suite is designed to be extended by any project. To add project-specific knowledge:

1. **Create `docs/iam/extensions.md`** — additional checklist items, known issues, custom patterns
2. **Create `docs/iam/access-rule-patterns.md`** — project-specific Oathkeeper rule templates
3. **Create `docs/iam/topology-spec.md`** — project-specific topology constraints

The meta-controller loads these files automatically during startup if they exist. They are merged with the core KB — project-local items take precedence over base items with the same ID.

## Error Recovery

| Error | Action |
|---|---|
| Phase sub-skill file not found | Abort with clear error |
| KB file not found | Warn, continue without that KB |
| `validate-infra.sh` fails | Re-enter DIAGNOSE with failure output |
| `run-all.sh` test fails | Re-enter DIAGNOSE with test output |
| `tofu validate` fails | Fix in EXECUTE/FIX-EXEC, do NOT proceed |
| Max fix iterations reached | Stop, report remaining issues to user |
