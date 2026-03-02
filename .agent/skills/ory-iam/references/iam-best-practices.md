# IAM Best Practices — Ory Kratos + Oathkeeper Production Checklist

> Comprehensive assessment checklist organized by category.
> Each item has a severity (CRITICAL / HIGH / MEDIUM / LOW) and a testable check.

---

## Category 1: Authentication Configuration

### 1.1 Password Policy [HIGH]

- [ ] Password minimum length ≥ 12 characters
- [ ] Breached password check enabled (`selfservice.methods.password.config.haveibeenpwned_enabled`)
- [ ] Identifier similarity check enabled

### 1.2 Multi-Factor Authentication [CRITICAL]

- [ ] At least one 2FA method enabled (TOTP, email OTP, or SMS)
- [ ] `mfa_enabled: true` at correct YAML level (top-level under method, NOT under config)
- [ ] `missing_credential_fallback_enabled: true` for users registered before 2FA was added
- [ ] AAL enforcement configured (`session.whoami.required_aal`)
- [ ] **Config keys validated against Go source** (`kratos/driver/config/config.go`) — e.g., `selfservice.flows.login.requested_aal` is INVALID, `session.whoami.required_aal` is VALID. Refer to [Kratos Source-Truth Configuration Guide](kratos-source-truth-config.md) for the exhaustive list.

### 1.3 Session Management [HIGH]

- [ ] Session cookie is HTTP-only (Kratos default, do not override)
- [ ] Session lifespan configured (not using default of 24h for sensitive apps)
- [ ] Session refresh (sliding window) configured if needed

### 1.4 Recovery Flow [HIGH]

- [ ] Recovery method configured (code or link)
- [ ] Rate limiting enabled on recovery endpoints
- [ ] Recovery code lifespan is short (≤ 15 minutes)

### 1.5 Registration Flow [MEDIUM]

- [ ] Registration does NOT have an explicit session hook (auto in v1.3.1)
- [ ] Email verification required before session creation
- [ ] CAPTCHA or Social Sign-In to reduce spam registrations

---

## Category 2: Access Proxy (Oathkeeper)

### 2.1 Access Rules [CRITICAL]

- [ ] Default-deny: requests that match no rule are rejected
- [ ] No `OPTIONS` in `oathkeeper.yml` `serve.proxy.cors.allowed_methods` (Oathkeeper handles preflight internally; OPTIONS IS allowed in access-rules.yml for explicit CORS preflight rules)
- [ ] No rule collisions (same URL glob + overlapping methods)
- [ ] Login/register/recovery routes use `anonymous` authenticator
- [ ] Protected API routes use `cookie_session` or `bearer_token` authenticator
- [ ] Every rule references only enabled authenticators/authorizers/mutators

### 2.2 Mutators [HIGH]

- [ ] `id_token` mutator configured with correct `issuer_url`, `jwks_url`, `ttl`
- [ ] JWT claims include `sub` at minimum
- [ ] `noop` mutator only used for truly unprotected routes
- [ ] Backend services validate JWTs against Oathkeeper's JWKS endpoint

### 2.3 Error Handlers [HIGH]

- [ ] `redirect` error handler for browser apps points to an `anonymous`-accessible URL
- [ ] `json` error handler for API routes (returns 401/403 JSON, not redirects)
- [ ] Error handler is correctly matched to app type (HTML vs JSON)

### 2.4 WebSocket / SignalR [MEDIUM]

- [ ] SignalR negotiate endpoint has an access rule (POST, /hubs/*/negotiate)
- [ ] WebSocket upgrade endpoint has an access rule (GET, ws:// or wss://)
- [ ] Nginx proxy-read-timeout and proxy-send-timeout ≥ 3600

---

## Category 3: Network & Proxy

### 3.1 TLS [CRITICAL]

- [ ] All ingresses have `ssl-redirect: "true"` and `force-ssl-redirect: "true"`
- [ ] Valid TLS certificate covers all subdomains
- [ ] cert-manager auto-renewal configured
- [ ] No HTTP-only ingresses in production

### 3.2 Nginx Proxy Headers [CRITICAL]

- [ ] `X-Forwarded-Proto: https` reaches Kratos (verify via Kratos pod logs)
- [ ] All app-level proxies (Next.js `/api/.ory/` routes) forward incoming `X-Forwarded-Proto` — NEVER hardcode to `'http'`
- [ ] `proxy-buffer-size` ≥ 8k (recommended 16k)
- [ ] `X-Forwarded-Host` set correctly
- [ ] **Cluster constraint:** `configuration-snippet` and `server-snippet` annotations are DISABLED — do NOT use them

### 3.3 CORS [HIGH]

- [ ] CORS handled at Oathkeeper only (`serve.proxy.cors.enabled: true`)
- [ ] All Nginx ingresses routing through Oathkeeper have `enable-cors: "false"` explicitly
- [ ] .NET backend has NO `UseCors()`, NO `AddCors()`, NO `Cors__AllowedOrigins__*` env vars
- [ ] No wildcard origin (`*`) combined with credentials
- [ ] All frontend app domains listed in `allowed_origins`
- [ ] `allow_credentials: true` when using cookies
- [ ] No `OPTIONS` in `oathkeeper.yml` `serve.proxy.cors.allowed_methods` (OPTIONS IS allowed in access-rules.yml for explicit CORS preflight rules)

### 3.4 Cookie Domain [CRITICAL]

- [ ] `serve.public.base_url` uses `https://` scheme
- [ ] `session.cookie.domain` set to parent domain (e.g., `.prometheusags.ai`) for cross-subdomain cookie sharing
- [ ] No proxy cookie rewriting in production
- [ ] `SameSite` attributes are correct (Lax or Strict, not None without Secure)
- [ ] `cookie_session.config.only` does NOT filter cookies — `__Secure-` prefix causes mismatch
- [ ] **Anti-pattern:** Do NOT add `trusted_proxy_ip_cidrs` or `trusted_client_ips` to `serve.public` — NOT valid Kratos v1.3.1 keys (CrashLoopBackOff). Do NOT use `configuration-snippet` (disabled on AKS). Fix CSRF proto at the **app-level proxy** (forward incoming `X-Forwarded-Proto`).

### 3.5 `return_to` Preservation [HIGH]

- [ ] All auth form components (LoginForm, RegistrationForm, RecoveryForm) read `return_to` from search params and forward to Kratos flow initialization URL
- [ ] Navigation links between auth pages preserve `return_to` via `AuthNavLink` component
- [ ] `allowed_return_urls` includes all domains that may appear in `return_to`
- [ ] `default_browser_return_url` points to the main app (not the auth domain)

### 3.6 SignalR + Oathkeeper [HIGH]

- [ ] Custom `IUserIdProvider` (e.g., `OathkeeperUserIdProvider`) registered as singleton BEFORE `AddSignalR()`
- [ ] Frontend SignalR connections use `withCredentials: true`
- [ ] Session heartbeat pings HTTP endpoint periodically to extend Kratos sliding window (WebSocket frames do NOT extend sessions)
- [ ] `cookie_session` authenticator used in SignalR negotiate + WebSocket access rules

---

## Category 4: Infrastructure & Operations

### 4.1 Secrets Management [CRITICAL]

- [ ] Kratos DSN stored in K8s Secret (not ConfigMap)
- [ ] Courier SMTP connection URI stored in K8s Secret
- [ ] Oathkeeper JWKS signing key secured
- [ ] No secrets in git history

### 4.2 Deployment [HIGH]

- [ ] Kratos and Oathkeeper have readiness/liveness probes configured
- [ ] Resource limits set on all containers
- [ ] Pod disruption budget configured for HA
- [ ] Database migrations run before deployment (Kratos migration job)

### 4.3 Monitoring [HIGH]

- [ ] Pod restart alerts configured
- [ ] CrashLoopBackOff detection in monitoring
- [ ] Kratos health endpoint monitored (`/health/alive`)
- [ ] Oathkeeper health endpoint monitored (`/health/alive`)

### 4.4 Tracing [MEDIUM]

- [ ] OpenTelemetry tracing enabled (TRACING_PROVIDER=otel)
- [ ] Trace exporter URL configured
- [ ] Service names set for Kratos and Oathkeeper

### 4.5 Logging [MEDIUM]

- [ ] Log format is structured (JSON)

### 4.6 Backend JWT Validation [CRITICAL]

- [ ] Protected backends configured to fetch **raw JWKS** from Oathkeeper — NOT via OIDC discovery (`MetadataAddress`, `oidc.NewProvider()`)
- [ ] `ValidIssuer` matches Oathkeeper's `issuer_url` exactly (e.g., `https://oathkeeper-ssr.prometheusags.ai`)
- [ ] `ValidAudience` matches the `aud` claim in the `id_token` mutator claims template
- [ ] JWKS keys are cached after first fetch (not re-fetched on every request)
- [ ] Cross-namespace DNS used when backend and Oathkeeper are in different namespaces
- [ ] **Anti-pattern:** Do NOT point .NET `MetadataAddress` or equivalent OIDC discovery URL at a raw JWKS endpoint — Oathkeeper does NOT serve `/.well-known/openid-configuration`, causing silent signing key resolution failure → 401 on all requests
- [ ] Log level is `info` in production (not `debug`)
- [ ] Sensitive data not logged (passwords, tokens)

### 4.6 Backup & Recovery [HIGH]

- [ ] Kratos database has automated backups
- [ ] Backup restoration tested
- [ ] Recovery point objective (RPO) documented
- [ ] Recovery time objective (RTO) documented

---

## Category 5: Application Integration

### 5.1 SDK Usage [HIGH]

- [ ] Browser flows use `createBrowserLoginFlow` (not `createNativeLoginFlow`)
- [ ] All fetch calls include `credentials: 'include'`
- [ ] CSRF token sent in request body (not just header) for state-changing requests
- [ ] Flow IDs not cached across page refreshes

### 5.2 Redirect Safety [CRITICAL]

- [ ] Next.js middleware excludes login/register/recovery/verification paths
- [ ] No redirect loop between middleware and Kratos
- [ ] AAL2 step-up handled separately from initial login
- [ ] Oathkeeper error handler redirect URL is accessible without auth

### 5.3 Logout [HIGH]

- [ ] Logout calls Kratos session termination API
- [ ] Client clears local session state after Kratos logout
- [ ] Post-logout redirect URL configured and accessible
