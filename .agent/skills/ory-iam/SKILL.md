---
name: ory-iam
description: >
  Full lifecycle Ory IAM management: Design → Plan → Execute → Reflect → Assess →
  Diagnose → Fix-Plan → Fix-Exec → Validate. Activate when asked to: add Kratos/Oathkeeper
  to an app, fix auth redirect loops, fix CSRF issues, debug login/logout failures, add
  or reconfigure 2FA, change Oathkeeper access rules, assess IAM compliance, or modify any
  infrastructure involving identity management. Uses a knowledge base of validated issues
  and automated tests to prevent repeating known mistakes.
license: Proprietary
compatibility: >
  Requires kubectl, tofu (OpenTofu), curl, jq, and cluster access for live checks.
  Designed for Claude Code and compatible agent products.
metadata:
  author: "San Saba Royalty"
  version: "1.0.0"
  ory-kratos-version: "1.3.1"
  ory-oathkeeper-version: "latest"
allowed-tools:
  - file_system
  - terminal
  - web_search
---

# Ory IAM Skill Suite

## Overview

This is a package of 9 linked sub-skills for managing Ory Kratos and Oathkeeper
infrastructure. Each sub-skill is in its own directory and should be invoked in order.

## When to Use This Skill

Activate when ANY of these apply:

- Adding Kratos/Oathkeeper to a new or existing app
- Fixing login, logout, registration, or 2FA redirect loops
- Fixing CSRF violations (`security_csrf_violation`)
- Changing Oathkeeper access rules
- Adding or modifying 2FA (TOTP, email OTP, SMS/Twilio)
- Changing Nginx ingress configuration for auth-related services
- Debugging any 401, 403, or redirect loop in production
- Assessing or auditing an existing IAM setup for compliance

## Sub-Skills (in execution order)

### New Implementation Flow

1. **DESIGN** → `design/SKILL.md` — Spec the IAM topology before writing config
2. **PLAN** → `plan/SKILL.md` — Analyze code + KB, generate task list
3. **EXECUTE** → `execute/SKILL.md` — Write configs, TF, templates
4. **REFLECT** → `reflect/SKILL.md` — Did output match spec? What did we avoid?
5. **ASSESS** → `assess/SKILL.md` — Score compliance against 50+ best practice items

### Problem Resolution Flow (enter here when something breaks)

1. **DIAGNOSE** → `diagnose/SKILL.md` — Ordered 7-step diagnostic protocol
2. **FIX-PLAN** → `fix-plan/SKILL.md` — Create fix tasks from diagnosis
3. **FIX-EXEC** → `fix-exec/SKILL.md` — Apply fixes from fix task list
4. **VALIDATE** → `validate/SKILL.md` — Run 14 automated tests, confirm green

## References

Domain-specific knowledge lives in `references/`:

| File | Content |
| :--- | :--- |
| `references/iam-best-practices.md` | 50+ checklist items across 5 categories with severity levels |

## Knowledge Base

All sub-skills reference the knowledge base at:
`docs/desperate/skill-fixes-content-infrastructure/`

Key files:

- `redirect-loop-patterns.md` — 10 confirmed redirect loop patterns with fixes
- `oathkeeper-multi-app-cors.md` — 8 multi-app CORS issues with fixes
- `kratos-2fa-mfa-config.md` — 2FA configuration (email OTP, TOTP, SMS/Twilio)
- `csrf-cookies-behind-proxy.md` — CSRF and cookie issues behind reverse proxies
- `nginx-reverse-proxy-trust.md` — Nginx annotation patterns for Kratos
- `tls-dns-certificates.md` — TLS/DNS/cert-manager gotchas
- `pre-commit-checklist.md` — Mandatory checklist before committing
- `post-deploy-test-plan.md` — 14 automated tests that must pass

## Scripts

| Action | Outcome |
| :--- | :--- |
| `scripts/validate-infra.sh` | Pre-commit infrastructure validation (8 checks) |
| `tests/infra/run-all.sh` | Post-deploy automated test suite (14 tests) |

## Hard Rules (apply to ALL sub-skills)

1. **NEVER guess a config key.** Verify against the Kratos v1.3.1 JSON schema.
2. **NEVER add OPTIONS to Oathkeeper's `serve.proxy.cors.allowed_methods` in `oathkeeper.yml`.** Oathkeeper handles CORS preflight internally when CORS is enabled; adding OPTIONS there fails schema validation. However, OPTIONS **IS** valid in `access-rules.yml` match rules (for explicit CORS preflight rules with `anonymous` authenticator).
3. **ALWAYS run `scripts/validate-infra.sh` before committing.**
4. **ALWAYS run `tofu validate` before committing.**
5. **ALWAYS generate a topology report in `docs/infrastructure/` after changes.**
6. **If a fix fails, return to DIAGNOSE. Do NOT stack more fixes.**
7. **NEVER hardcode `X-Forwarded-Proto` to `'http'`** in any proxy between Nginx and Kratos. Forward the incoming header.
8. **NEVER use `configuration-snippet` or `server-snippet` annotations.** They are disabled on our AKS cluster (`allow-snippet-annotations: false`).
9. **NEVER add `trusted_proxy_ip_cidrs` or `trusted_client_ips`** to Kratos `serve.public` — they are not valid v1.3.1 keys and cause CrashLoopBackOff.
10. **NEVER point an OIDC discovery URL at Oathkeeper's raw JWKS endpoint.** Oathkeeper does NOT serve `/.well-known/openid-configuration`. Configure protected backends to fetch JWKS directly (e.g., via `OnMessageReceived` in .NET, not `MetadataAddress`).
11. **ALWAYS validate config keys against the Kratos/Oathkeeper Go source code** in the workspace (`/Users/gqadonis/Projects/sansaba/kratos` and `/Users/gqadonis/Projects/sansaba/oathkeeper`) before committing ANY infrastructure change. Search `driver/config/config.go` for the Viper key constant (e.g., `ViperKeySessionWhoAmIAAL`) and confirm the key exists and is at the right path. If you cannot find the key in the source, it is NOT valid and WILL cause CrashLoopBackOff. Example: `selfservice.flows.login.requested_aal` does NOT exist in the source — `session.whoami.required_aal` is the correct key.

## Absolute Source-Truth Reference Guides

Before touching **any** configuration, consult these definitive guides mapped directly to the actual Kratos and Oathkeeper Go source code running in this workspace:

- ▶️ **[Kratos Source-Truth Configuration](references/kratos-source-truth-config.md)**: Explicit layout of `selfservice.flows.*`, `session.whoami.required_aal`, and `courier.*` mapped to `kratos/driver/config/config.go`.
- ▶️ **[Oathkeeper Source-Truth Configuration](references/oathkeeper-source-truth-config.md)**: Explicit layout of `Rule`, `AuthenticatorCookieSessionConfiguration`, `ErrorRedirectConfig`, etc.

## Quick Start

- `/iam-assess` — Run compliance assessment against best practices
- `/iam-diagnose` — Enter diagnostic mode when something breaks
- `/iam-validate` — Run post-deploy test suite
