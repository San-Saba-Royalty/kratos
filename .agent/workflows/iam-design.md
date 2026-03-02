---
description: Design an IAM topology spec before writing any configuration — covers app inventory, cookie strategy, CORS matrix, 2FA, and redirect rules
---

# IAM Design

Produce a complete IAM specification BEFORE any config is written. This prevents the "fix it later" pattern.

## Step 1 — Load the DESIGN Skill

Read `.agent/skills/ory-iam/design/SKILL.md` for the full protocol.

## Step 2 — Load Best Practices

// turbo
Read `.agent/skills/ory-iam/references/iam-best-practices.md` to inform the design.

## Step 3 — Load Project Extensions

// turbo
If `docs/iam/extensions.md` exists, read it for project-specific design constraints.

## Step 4 — Ask Mandatory Design Questions

You MUST gather answers to ALL of these before proceeding:

1. **App inventory** — every app, its subdomain, and auth mode
2. **Cookie vs JWT** — per app: cookie-first, JWT-first, or headless?
3. **Cross-app calls** — do any two apps from DIFFERENT subdomains call each other from the browser?
4. **WebSocket/SignalR** — does any app use WebSockets?
5. **2FA requirements** — which methods, immediate vs stepped-up AAL?
6. **Redirect destinations** — where do unauthenticated users go per app type?

## Step 5 — Produce Spec Files

Generate these in a `spec/` directory in the project:

- `spec/topology.md` — traffic flow diagram
- `spec/app-inventory.md` — app list with auth modes
- `spec/cookie-strategy.md` — cookie domains, SameSite
- `spec/cors-matrix.md` — which origins call which endpoints
- `spec/2fa-requirements.md` — methods, AAL levels
- `spec/redirect-rules.md` — per app type redirects

## Step 6 — Validate Against KB

Cross-check the spec against `redirect-loop-patterns.md` — does this design trigger any known pattern? If so, adjust before proceeding.

## Step 7 — Next Phase

Proceed to `/iam-plan` to convert the spec into a task list.
