---
name: ory-iam-assess
description: >
  Assess the compliance and health of an existing identity management project against
  IAM best practices. Produces a scored report with CRITICAL/HIGH/MEDIUM/LOW findings.
  Activate when asked to audit, assess, review, or check the health of an Ory Kratos/Oathkeeper setup.
---

# ASSESS Sub-Skill

## Purpose

Systematically evaluate an existing IAM deployment against documented best practices.
Produces a scored assessment report that identifies compliance gaps, security risks,
and configuration issues BEFORE they cause production incidents.

## Theory, Strategy & Thinking Patterns

> **THEORY**: Assessment is the act of checking actual, running state vs theoretical, best-practice state. Infrastructure drifts. Quick fixes become permanent technical debt. IAM debt leads directly to security breaches.
>
> **STRATEGY**: **Precondition Discovery**. You are not just looking for syntax errors; you are looking for the *preconditions* of failure. A missing `return_to` parameter in Oathkeeper's redirect error handler is a precondition for an infinite redirect loop waiting to trigger.
>
> **THINKING PATTERNS**:
>
> 1. **Trust Nothing**: Do not trust the Terraform state alone. Do not trust what the code "intended" to do. Assess what the YAML manifests actually say, and what the Nginx annotations *actually* rewrite.
> 2. **Blast Radius Analysis**: For every failed check, ask, "What is the worst-case scenario?" If CORS does not allow `OPTIONS`, SPAs break. If Kratos doesn't require AAL2 for `whoami`, 2FA can be silently bypassed.
> 3. **Source Code Empathy**: Understand *why* a misconfiguration is bad relative to the Go source. E.g., placing `mfa_enabled` inside `config` instead of at the root of `SelfServiceStrategyCode` causes the Go struct parser to ignore it, silently turning off MFA.

## When to Use

- Before going to production with a new IAM setup
- After any major infrastructure change (new app, new subdomain, 2FA addition)
- Periodically (monthly) as a health check
- When inheriting or auditing an existing project

## Inputs

The assessment reads these files/resources:

1. `k8s/opentofu/kratos.tf` — Kratos configuration
2. `k8s/opentofu/oathkeeper.tf` — Oathkeeper configuration
3. `k8s/opentofu/templates/access-rules.yml.tpl` — Access rules
4. `k8s/opentofu/templates/oathkeeper.yml.tpl` — Oathkeeper config
5. `k8s/opentofu/ingress.tf` — Nginx ingress annotations
6. Application source code (middleware, proxy routes, auth hooks)
7. Live cluster state (via `kubectl`, optional)

## Process

### Step 1: Load Best Practices Reference

Read `references/iam-best-practices.md` — the canonical checklist of 50+ items in 5 categories.

### Step 2: Static Analysis (Config Files)

For each item in the checklist, analyze the relevant config files:

```
Category 1: Authentication → kratos.tf, identity schema
Category 2: Access Proxy → access-rules.yml.tpl, oathkeeper.yml.tpl
Category 3: Network & Proxy → ingress.tf, oathkeeper.yml.tpl
Category 4: Infrastructure → k8s manifests, secrets, monitoring
Category 5: Application → middleware.ts, route.ts, auth hooks
```

### Step 3: Run Automated Checks

Execute `scripts/validate-infra.sh` and capture results.
If cluster access is available, run `tests/infra/run-all.sh` and capture results.

### Step 4: Cross-Reference Knowledge Base

For each finding, check if it matches a known issue in:

- `docs/desperate/skill-fixes-content-infrastructure/redirect-loop-patterns.md`
- `docs/desperate/skill-fixes-content-infrastructure/oathkeeper-multi-app-cors.md`
- `docs/desperate/skill-fixes-content-infrastructure/csrf-cookies-behind-proxy.md`
- `docs/desperate/skill-fixes-content-infrastructure/kratos-2fa-mfa-config.md`

If a match is found, include the known fix in the recommendation.

### Step 5: Score and Produce Report

## Output: Assessment Report

Generate `assess/report-YYYY-MM-DD.md` with:

```markdown
# IAM Assessment Report — [Date]

## Summary
- **Score:** X / 100
- **CRITICAL findings:** N
- **HIGH findings:** N
- **MEDIUM findings:** N
- **LOW findings:** N

## Scoring Method
- CRITICAL items failed: -15 points each
- HIGH items failed: -5 points each
- MEDIUM items failed: -2 points each
- LOW items failed: -1 point each
- Starting score: 100

## Findings

### CRITICAL

#### [Finding ID] — [Title]
- **Check:** [What was checked]
- **Expected:** [What was expected]
- **Actual:** [What was found]
- **Risk:** [What could happen if not fixed]
- **Fix:** [Specific fix with file and line]
- **KB Reference:** [Link to knowledge base entry, if applicable]

### HIGH
...

### MEDIUM
...

### LOW
...

## Compliance Matrix

| Category | Items | Pass | Fail | Skip | Score |
|---|---|---|---|---|---|
| Authentication | N | N | N | N | X% |
| Access Proxy | N | N | N | N | X% |
| Network & Proxy | N | N | N | N | X% |
| Infrastructure | N | N | N | N | X% |
| Application | N | N | N | N | X% |

## Recommendations (Priority Ordered)
1. [Most critical fix first]
2. ...

## Next Steps
- Run DIAGNOSE skill on any CRITICAL findings
- Schedule fixes via FIX-PLAN skill
```

## Rules

1. Every finding MUST reference a specific file and line number
2. Every CRITICAL finding MUST include the exact fix
3. Findings that match the knowledge base MUST cite the KB entry
4. The report MUST be dated and stored in the project for history tracking
5. If automated tests are available, their results MUST be included
6. Do NOT guess — if you can't verify a check, mark it as SKIP
