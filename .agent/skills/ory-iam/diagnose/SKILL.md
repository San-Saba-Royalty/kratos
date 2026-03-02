---
name: ory-iam-diagnose
description: Ordered 7-step diagnostic protocol — enter here when something breaks after deploy
---

# DIAGNOSE Sub-Skill

## Purpose

Systematic diagnosis of infrastructure failures. Follow every step in order.

## Theory, Strategy & Thinking Patterns

> **THEORY**: The proxy-auth-app architecture is distributed. A symptom at the browser (e.g., infinite redirect) is almost never the root cause; it is merely the final domino falling. The root cause is a dropped header, a malformed cookie, or a failed rule hydration occurring hops earlier.
>
> **STRATEGY**: **Network Hop Isolation**. You cannot diagnose the whole system at once. You must treat every network hop as a distinct black box. You map the request exactly as it enters and exits each box until you find the exact mutation that caused the failure.
>
> **THINKING PATTERNS**:
>
> 1. **Logs Are Sovereign**: Do not guess what Kratos/Oathkeeper is doing. Read the exact JSON log line. If Oathkeeper says "rule match failed," then the `url` regex or `methods` array is wrong.
> 2. **Hypothesis vs Guessing**: Guessing is changing YAML and running `tofu apply`. A Hypothesis is testable *before* changing code (e.g., `curl -H "X-Forwarded-Proto: http" localhost:4456` to prove the header triggers a redirect loop).
> 3. **The 'Header Drift' Concept**: Cloud provider load balancers (AWS ALBs, Azure AGIC) drop customized or misconfigured headers. Always verify that Oathkeeper *actually receives* what the browser sent.

## Step 1: Read the EXACT Error

```bash
kubectl logs -n iam deployment/kratos --tail=100 2>&1
kubectl logs -n iam deployment/oathkeeper --tail=100 2>&1
kubectl get pods -n iam
kubectl describe pod -n iam -l app=kratos | grep -E 'State|Reason|Restart'
```

Copy the exact error message. Not a summary — the raw log line.

## Step 2: Match Against Knowledge Base

Open these files and search for the error:

- `docs/desperate/skill-fixes-content-infrastructure/redirect-loop-patterns.md`
- `docs/desperate/skill-fixes-content-infrastructure/oathkeeper-multi-app-cors.md`
- `docs/desperate/skill-fixes-content-infrastructure/csrf-cookies-behind-proxy.md`
- `docs/desperate/skill-fixes-content-infrastructure/kratos-2fa-mfa-config.md`

If a match is found:

- Apply ONLY the documented fix
- Verify the fix is valid for the EXACT version running:

  ```bash
  kubectl get deployment -n iam -o jsonpath='{.items[*].spec.template.spec.containers[*].image}'
  ```

- If the fix involves a config key: verify key exists in the JSON schema FIRST
- Proceed to FIX-PLAN

## Step 3: Trace the Request Path

If no match found, draw the full path before touching any config:

```
BROWSER → Nginx ingress → [Oathkeeper?] → [Kratos?] → App
```

For each hop, answer:

- a) What scheme does this hop see? (http or https)
- b) What headers does it forward?
- c) What cookies does it see?
- d) What does it return on error?

**The failure is at the hop where the answer changes unexpectedly.**

Use these tools:

```bash
# Trace a request through Nginx
curl -v --resolve auth-ssr.prometheusags.ai:443:LOADBALANCER_IP https://auth-ssr.prometheusags.ai/login 2>&1

# Test Oathkeeper decision for a specific route
kubectl port-forward -n iam svc/oathkeeper-api 4456:4456
curl http://localhost:4456/decisions -H "X-Forwarded-Method: GET" -H "X-Forwarded-Host: api-ssr.prometheusags.ai" -H "X-Forwarded-Uri: /api/buyers"
```

## Step 4: Identify the Layer

- **Nginx:** wrong X-Forwarded-Proto, upstream port, buffer, missing annotation
- **Oathkeeper:** rule collision, wrong handler, OPTIONS in rules, glob mismatch
- **Kratos:** invalid config key, wrong flow URL, base_url scheme mismatch
- **App proxy:** cookie rewrite in production, SDK base URL wrong
- **DNS/TLS:** cert expired, propagation pending, shared cert not covering domain

## Step 5: Redirect Loop Protocol

If the symptom is a redirect loop, ALWAYS check ALL of these:

- [ ] Is Kratos redirecting to a URL that middleware considers unauthenticated?
- [ ] Is the Oathkeeper error handler redirect_to pointing at a protected URL?
- [ ] Is Next.js middleware redirecting on paths that include the login page itself?
- [ ] Does Oathkeeper cookie_session return 401 because cookie Domain is wrong?
- [ ] Is this an AAL2 (2FA) loop: session exists but required_aal=aal2 can't complete?
- [ ] Headless confusion: createBrowserLoginFlow vs createNativeLoginFlow?
- [ ] JWT transition: mutator not firing (noop vs id_token)?

## Step 6: Document Findings

Before proceeding to FIX-PLAN, document:

- Which layer failed
- Which exact config line/file was wrong
- Why the current config is incorrect
- What the fix should be

## Step 7: Proceed to FIX-PLAN

Pass the documented findings to FIX-PLAN. Do NOT apply fixes during DIAGNOSE.
