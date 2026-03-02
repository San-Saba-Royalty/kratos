---
name: ory-iam-design
description: Produce an IAM topology spec before writing any configuration
---

# DESIGN Sub-Skill

## Purpose

Produce a complete IAM specification BEFORE any config, Terraform, or access rules are written.
This prevents the "fix it later" pattern that causes redirect loops and CSRF bugs.

## Theory, Strategy & Thinking Patterns

> **THEORY**: Security is a funnel. Your architecture is an unbroken chain of trust: `Browser -> Edge (Cloud LB) -> Proxy (Oathkeeper) -> Identity (Kratos) -> Application`. If any link misinterprets a header, drops a cookie, or alters a redirect, the chain fails.
>
> **STRATEGY**: The goal of the Design phase is to **project the state space of the network**. You are mapping the exact route a token or cookie takes. You must establish trust boundaries: Subdomains can share cookies (with `Domain=.example.com`); strictly disjoined domains cannot, and thus require a unified token strategy or OIDC.
>
> **THINKING PATTERNS**:
>
> 1. **Zero-Trust Assumption**: Assume every app is inherently insecure. Oathkeeper is the shield. The design must place Oathkeeper in front of *everything* except the Kratos public endpoints.
> 2. **State Location**: Ask "Where does the state live?". Kratos is stateful (Database). Oathkeeper is stateless (memory/rule evaluation). Apps should be stateless (relying on Oathkeeper's JWT or header injection).
> 3. **The Redirect Loop Mindset**: Why do loops happen? Because an app asks for Auth, Oathkeeper redirects to Auth, Auth thinks you are Authenticated and redirects back, but the *cookie was dropped along the way*, so the app asks for Auth again. Designing the cookie domain and SameSite policy correctly prevents 99% of IAM bugs.

## Mandatory Questions (ask ALL before producing spec)

1. **App inventory:** List every app (Next.js, SPA, .NET API, etc.), its subdomain, and its auth mode
2. **Cookie vs JWT:** Is each app cookie-first, JWT-first, or headless (no browser flows)?
3. **Cross-app calls:** Do any two apps from DIFFERENT subdomains call each other from the browser?
4. **WebSocket/SignalR:** Does any app use WebSockets or SignalR?
5. **2FA requirements:** Required for all users? Which methods? Immediately at login or stepped-up AAL?
6. **Redirect destinations:** Where does each app type redirect unauthenticated users? (HTML → login page, JSON API → 401)

## Outputs

Generate these files in a `spec/` directory within the working artifact space:

| File | Content |
|---|---|
| `spec/topology.md` | Traffic flow diagram: Browser → Nginx → Oathkeeper → Kratos → App |
| `spec/app-inventory.md` | Every app with: type, subdomain, auth mode, cookie/JWT strategy |
| `spec/cookie-strategy.md` | Cookie domains, SameSite, cross-subdomain requirements |
| `spec/cors-matrix.md` | Which origins call which endpoints (from browser) |
| `spec/2fa-requirements.md` | Methods, AAL levels, step-up vs immediate |
| `spec/redirect-rules.md` | Where unauthenticated users land per app type |

## Validation

Before proceeding to PLAN, verify the spec against `redirect-loop-patterns.md` — does this design trigger any known pattern?
