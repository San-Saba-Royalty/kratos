---
name: ory-iam-reflect
description: Post-deploy analysis comparing spec vs actual, documenting pitfalls avoided
---

# REFLECT Sub-Skill

## Purpose

Run AFTER a successful deployment. Produces a reflect report that compares
what was designed (spec) vs what was deployed (actual).

## Theory, Strategy & Thinking Patterns

> **THEORY**: A successful deployment is not the end of the lifecycle; it is merely a new baseline data point.
>
> **STRATEGY**: **The Documentation Loop**. If a unique infrastructure constraint was discovered during `FIX-EXEC`, or if a `DESIGN` assumption proved false, that realization is worthless if it remains in the engineer's memory. The reflect phase serves to immortalize hard-won knowledge back into the `references/`.
>
> **THINKING PATTERNS**:
>
> 1. **Spec vs Absolute Truth**: The initial `DESIGN` spec was a hypothesis. Compare every item in it to the deployed OpenTofu state. Where did the hypothesis fail? Why?
> 2. **Pitfall Documentation**: If you encountered a redirect loop and fixed it, add the exact symptom and fix to `redirect-loop-patterns.md`. You are building the LLM's brain for the *next* deployment.

## Process

1. **Spec vs Actual:** Read the DESIGN spec and compare every item to the deployed config
2. **Known Issues Avoided:** List which entries from the knowledge base were applicable and how they were handled
3. **Open Risks:** What wasn't tested? What edge cases could still break?
4. **Lessons Learned:** What should be added to the knowledge base from this implementation?

## Outputs

`reflect/report.md` containing:

- ✅ Spec items that match deployed config
- ⚠️ Deviations from spec with justification
- 📋 Known issues that were successfully avoided
- 🔴 Open risks that need monitoring

## When Problems Are Found

If REFLECT identifies a discrepancy that could cause issues → proceed to DIAGNOSE (Skill 5).
Do NOT fix inline during REFLECT. Document it, then enter the fix cycle.
