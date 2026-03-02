---
name: add-identity-management
description: >
  Add full identity management to any Next.js application using Ory Kratos (identity),
  Ory Oathkeeper (access proxy), and Resend (email delivery). Scaffolds all config files,
  Docker Compose services, proxy routes, UI flow components, and identity schema.
  Covers: registration, login, email verification, account recovery, settings, TOTP 2FA,
  email OTP 2FA, and optional SMS 2FA via Twilio. Produces a working local dev environment
  at http://localhost:3000 (auth UI) + http://localhost:4455 (Oathkeeper proxy).
  Activate when asked to add auth, identity management, login, registration, or SSO
  to a Next.js project.
---

# Add Identity Management Skill

Adds Ory Kratos + Oathkeeper + Resend identity management to any Next.js application.
Works regardless of whether the target app is a Pages Router or App Router project.

---

## Phase 0 — Audit the Target Project

Before generating any files, read:

1. `package.json` — detect router type (Pages or App), TypeScript, existing auth deps
2. `next.config.*` — note rewrites, basePath, existing proxy config
3. `src/middleware.ts` or `middleware.ts` — note any existing middleware
4. `.env*` files — note existing env vars to avoid collisions

```
list_dir <project_root>
view_file <project_root>/package.json
view_file <project_root>/next.config.*
```

Record:
- **Router**: `pages/` (Pages Router) or `app/` (App Router)
- **Package manager**: `npm` / `yarn` / `pnpm`
- **Port**: what port does the Next.js app run on? (default 3000)
- **Existing auth**: remove or replace any existing next-auth / clerk / supabase auth

---

## Phase 1 — Install Dependencies

```bash
# Install Ory SDK and Elements (React UI components)
pnpm add @ory/client-fetch @ory/elements-react

# Remove any conflicting auth packages if present
pnpm remove next-auth @clerk/nextjs @supabase/auth-helpers-nextjs
```

**`@ory/client-fetch`** — typed Kratos REST client (no axios dependency)
**`@ory/elements-react`** — pre-built registration/login/verification/recovery/settings UI

---

## Phase 2 — Create the Directory Structure

```
<project>/
├── kratos/
│   ├── kratos.yml              ← Kratos configuration
│   └── identity.schema.json   ← Identity traits schema
├── oathkeeper/
│   ├── oathkeeper.yml          ← Oathkeeper serve + mutator config
│   ├── rules.yml               ← Access rules
│   └── jwks.json              ← RSA signing key (generate — see Phase 6)
├── pages/                      ← Pages Router (or app/ for App Router)
│   ├── login.tsx
│   ├── registration.tsx
│   ├── verification.tsx
│   ├── recovery.tsx
│   ├── settings.tsx
│   ├── error.tsx
│   └── api/.ory/[...paths].ts  ← Proxy route (critical — avoids CORS)
└── src/
    └── features/auth/
        ├── components/          ← Flow components (LoginComponent, etc.)
        └── services/
            ├── kratos-service.ts
            └── ory-config.ts
```

---

## Phase 3 — Create Kratos Configuration

### `kratos/identity.schema.json`

```json
{
  "$id": "https://schemas.ory.sh/presets/kratos/identity.email.schema.json",
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Person",
  "type": "object",
  "properties": {
    "traits": {
      "type": "object",
      "properties": {
        "email": {
          "type": "string",
          "format": "email",
          "title": "E-Mail",
          "minLength": 3,
          "ory.sh/kratos": {
            "credentials": {
              "password": { "identifier": true },
              "code": { "identifier": true, "via": "email" },
              "totp": { "account_name": true }
            },
            "recovery": { "via": "email" },
            "verification": { "via": "email" }
          }
        },
        "name": {
          "type": "object",
          "properties": {
            "first": { "type": "string", "title": "First Name" },
            "last": { "type": "string", "title": "Last Name" }
          }
        },
        "phone": {
          "type": "string",
          "title": "Phone Number",
          "description": "Optional — for future SMS 2FA. Format: E.164 e.g. +12125551234"
        }
      },
      "required": ["email", "name"],
      "additionalProperties": false
    }
  }
}
```

> **To add SMS 2FA via Twilio later**: add `"ory.sh/kratos": { "credentials": { "code": { "identifier": true, "via": "sms" } } }` to the `phone` trait. Warning: this enrolls the phone as an MFA credential and will require AAL2 after login.

### `kratos/kratos.yml`

```yaml
version: v0.13.0

dsn: memory   # Use postgresql://... for persistent storage

serve:
  public:
    base_url: http://localhost:3000/api/.ory
    cors:
      enabled: true
      allowed_origins:
        - http://localhost:3000
      allowed_headers:
        - Authorization
        - Cookie
        - Content-Type
      exposed_headers:
        - Content-Type
        - Set-Cookie
  admin:
    base_url: http://localhost:4434/

selfservice:
  default_browser_return_url: http://localhost:3000/
  allowed_return_urls:
    - http://localhost:3000
    - http://localhost:4455

  methods:
    password:
      enabled: true
      config:
        # Disable in dev — REMOVE for production
        haveibeenpwned_enabled: false

    # Email OTP — for verification, recovery, and optional 2FA
    code:
      enabled: true
      mfa_enabled: true          # allows email OTP as a second factor
      passwordless_enabled: false

    # TOTP (Google Authenticator / Authy)
    totp:
      enabled: true

    # Password-less login link
    link:
      enabled: true

    profile:
      enabled: true

  flows:
    error:
      ui_url: http://localhost:3000/error

    settings:
      ui_url: http://localhost:3000/settings
      privileged_session_max_age: 15m
      required_aal: highest_available

    recovery:
      enabled: true
      ui_url: http://localhost:3000/recovery
      use: code

    verification:
      enabled: true
      ui_url: http://localhost:3000/verification
      use: code
      after:
        default_browser_return_url: http://localhost:3000/

    login:
      ui_url: http://localhost:3000/login
      lifespan: 10m
      after:
        default_browser_return_url: http://localhost:3000/

    registration:
      lifespan: 10m
      ui_url: http://localhost:3000/registration
      after:
        password:
          hooks:
            - hook: session
            # NOTE: show_verification_ui is intentionally omitted.
            # Kratos still sends the verification email automatically.
            # Redirect immediately after registration causes aal=aal2 error
            # because the new AAL1 session cookie has not yet propagated.

log:
  level: info
  format: text
  leak_sensitive_values: true

identity:
  default_schema_id: default
  schemas:
    - id: default
      url: file:///etc/config/kratos/identity.schema.json

courier:
  smtp:
    # Injected at runtime via COURIER_SMTP_CONNECTION_URI env var
    # Set in docker-compose.yml: smtp://resend:<RESEND_API_KEY>@smtp.resend.com:587/
    connection_uri: smtp://localhost:25/
    from_address: auth@yourdomain.com
    from_name: "Your App"
```

---

## Phase 4 — Create Oathkeeper Configuration

### `oathkeeper/oathkeeper.yml`

```yaml
serve:
  proxy:
    port: 4455
    cors:
      enabled: true
      allowed_origins:
        - http://localhost:3000
        - http://localhost:3001
      allowed_methods: [POST, GET, PUT, PATCH, DELETE]
      allowed_headers: [Authorization, Cookie, Content-Type]
      exposed_headers: [Content-Type, Set-Cookie]
  api:
    port: 4456

access_rules:
  repositories:
    - file:///etc/config/oathkeeper/rules.yml

errors:
  fallback:
    - json
  handlers:
    json:
      enabled: true
      config:
        verbose: true
    redirect:
      enabled: true
      config:
        # ← return_to is CRITICAL: passes the original URL through Kratos
        #   so the user is redirected back after login.
        to: "http://localhost:3000/login?return_to={{ .URL | urlquery }}"
        when:
          - error: [unauthorized, forbidden]
            request:
              header:
                accept: [text/html, application/json]

mutators:
  noop:
    enabled: true
  id_token:
    enabled: true
    config:
      issuer_url: http://localhost:4455/
      jwks_url: file:///etc/config/oathkeeper/jwks.json
      claims: |
        {
          "session": {{ .Extra | toJson }}
        }

authorizers:
  allow:
    enabled: true
  deny:
    enabled: true

authenticators:
  noop:
    enabled: true
  cookie_session:
    enabled: true
    config:
      check_session_url: http://kratos:4433/sessions/whoami
      preserve_path: true
      extra_from: "@this"
      subject_from: "identity.id"
      only:
        - ory_kratos_session
  bearer_token:
    enabled: true
    config:
      check_session_url: http://kratos:4433/sessions/whoami
      preserve_path: true
      extra_from: "@this"
      subject_from: "identity.id"
```

### `oathkeeper/rules.yml`

```yaml
# Protect your application (replace ssr-frontend:3000 with your app's internal URL)
- id: "app:protected"
  upstream:
    preserve_host: true
    url: "http://your-app:3000"
    strip_path: /app
  match:
    url: "<.*>app<(/.*)?>"
    methods: [GET, POST, PUT, DELETE, PATCH]
  authenticators:
    - handler: cookie_session
    - handler: bearer_token
  authorizer:
    handler: allow
  mutators:
    - handler: id_token
  errors:
    - handler: redirect
      config:
        # Pass original URL as return_to so user comes back after login
        to: "http://localhost:3000/login?return_to={{ .URL | urlquery }}"
```

---

## Phase 5 — Docker Compose

### `docker-compose.yml`

```yaml
version: "3.9"

services:
  kratos-migrate:
    image: oryd/kratos:latest
    environment:
      - DSN=memory
    volumes:
      - ./kratos:/etc/config/kratos:ro
    command: -c /etc/config/kratos/kratos.yml migrate sql -e --yes
    restart: on-failure

  kratos:
    image: oryd/kratos:latest
    depends_on:
      kratos-migrate:
        condition: service_completed_successfully
    ports:
      - "4433:4433"   # public API
      - "4434:4434"   # admin API
    restart: unless-stopped
    volumes:
      - ./kratos:/etc/config/kratos:ro
    command: serve -c /etc/config/kratos/kratos.yml --dev --watch-courier
    environment:
      - DSN=memory
      - DEV=true
      # CRITICAL: must route through the Next.js proxy so Kratos generates
      # correct form action URLs (not http://127.0.0.1:4433/...)
      - SERVE_PUBLIC_BASE_URL=http://localhost:3000/api/.ory
      - SERVE_ADMIN_BASE_URL=http://127.0.0.1:4434/
      - LOG_LEVEL=trace
      - SECRETS_DEFAULT=change_me_32_chars_minimum_required!
      - SECRETS_COOKIE=change_me_32_chars_minimum_required!
      # Disable HaveIBeenPwned in dev — REMOVE for production
      - SELFSERVICE_METHODS_PASSWORD_HAVEIBEENPWNED_ENABLED=false
      # Resend SMTP (set RESEND_API_KEY and KRATOS_FROM_EMAIL in .env)
      - COURIER_SMTP_CONNECTION_URI=smtp://resend:${RESEND_API_KEY}@smtp.resend.com:587/
      - COURIER_SMTP_FROM_ADDRESS=${KRATOS_FROM_EMAIL:-auth@yourdomain.com}

  oathkeeper:
    image: oryd/oathkeeper:latest
    depends_on:
      - kratos
    ports:
      - "4455:4455"   # proxy port
      - "4456:4456"   # API port
    volumes:
      - ./oathkeeper:/etc/config/oathkeeper:ro
    command: serve proxy -c "/etc/config/oathkeeper/oathkeeper.yml"
    restart: on-failure

  # Add your Next.js app service here:
  # auth-app:
  #   build: .
  #   ports:
  #     - "3000:3000"
  #   depends_on:
  #     - kratos
```

### `.env.local` (copy from `.env.local.example`)

```bash
# Kratos public URL — use the proxy so browser requests have correct cookie scope
ORY_SDK_URL=http://localhost:3000/api/.ory

# Resend — get your API key from https://resend.com
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx

# Sender address — must be verified in Resend
KRATOS_FROM_EMAIL=auth@yourdomain.com
```

---

## Phase 6 — Generate the JWKS Signing Key

Oathkeeper's `id_token` mutator signs JWTs with an RSA private key.
**A placeholder or invalid JWKS will cause a 500 error.**

```bash
# Method 1: Node.js (recommended — no extra deps)
node -e "
const { generateKeyPairSync, randomUUID } = require('crypto');
const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const jwk = privateKey.export({ format: 'jwk' });
jwk.use = 'sig';
jwk.kid = randomUUID();
console.log(JSON.stringify({ keys: [jwk] }, null, 2));
" > oathkeeper/jwks.json

# Method 2: Ory CLI
oathkeeper credentials generate --alg RS256 > oathkeeper/jwks.json

# Method 3: Python 3
pip install cryptography
python3 - << 'EOF' > oathkeeper/jwks.json
import json, base64, uuid
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.backends import default_backend
def b64u(n):
    nb=(n.bit_length()+7)//8
    return base64.urlsafe_b64encode(n.to_bytes(nb,'big')).rstrip(b'=').decode()
k=rsa.generate_private_key(65537,2048,default_backend())
p,u=k.private_numbers(),k.public_key().public_numbers()
print(json.dumps({"keys":[{"use":"sig","kty":"RSA","kid":str(uuid.uuid4()),
    "n":b64u(u.n),"e":b64u(u.e),"d":b64u(p.d),"p":b64u(p.p),
    "q":b64u(p.q),"dp":b64u(p.dp),"dq":b64u(p.dq),"qi":b64u(p.qi)}]},indent=2))
EOF
```

> **CAUTION**: Never commit production JWKS to source control. Use a secrets manager in production.

---

## Phase 7 — Ory API Proxy Route (Critical)

This resolves CORS issues and keeps all Kratos cookies on `localhost:3000`.

### `pages/api/.ory/[...paths].ts`

```typescript
import type { NextApiRequest, NextApiResponse } from 'next'
import http from 'http'
import https from 'https'

export const config = {
  api: { bodyParser: false, externalResolver: true },
}

// Headers that must NOT be forwarded between HTTP proxies (RFC 2616 §13.5.1)
const HOP_BY_HOP = new Set([
  'connection','keep-alive','proxy-authenticate','proxy-authorization',
  'te','trailers','transfer-encoding','upgrade','content-length',
])

const KRATOS_URL = process.env.ORY_SDK_URL || 'http://localhost:4433'
const kratosUrl  = new URL(KRATOS_URL.replace('/api/.ory', ''))
// Resolve to the actual Kratos container URL (not the proxy loop)
const UPSTREAM   = process.env.KRATOS_INTERNAL_URL || 'http://localhost:4433'
const upstreamUrl = new URL(UPSTREAM)
const transport   = upstreamUrl.protocol === 'https:' ? https : http

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Strip /api/.ory prefix before forwarding to Kratos
  const upstream = req.url?.replace(/^\/api\/.ory/, '') || '/'

  // Build forwarded headers — strip hop-by-hop, keep everything else
  const forwardedHeaders: Record<string, string | string[]> = {}
  for (const [key, value] of Object.entries(req.headers)) {
    if (!HOP_BY_HOP.has(key.toLowerCase()) && value !== undefined) {
      forwardedHeaders[key] = value as string | string[]
    }
  }

  // Override required headers — forward original Accept so browser nav
  // gets the 303 redirect and SDK fetches get JSON
  forwardedHeaders['host']             = upstreamUrl.host
  forwardedHeaders['x-forwarded-host'] =
    (Array.isArray(req.headers.host) ? req.headers.host[0] : req.headers.host) || 'localhost'
  forwardedHeaders['x-forwarded-proto'] = 'http'

  const options: http.RequestOptions = {
    hostname: upstreamUrl.hostname,
    port: upstreamUrl.port || (upstreamUrl.protocol === 'https:' ? 443 : 80),
    path: upstream,
    method: req.method,
    headers: forwardedHeaders,
  }

  const proxyReq = transport.request(options, (proxyRes) => {
    // Rewrite Set-Cookie: Domain=localhost, SameSite=Lax for local dev
    const rawCookies     = proxyRes.headers['set-cookie'] || []
    const rewrittenCookies = rawCookies.map((c) =>
      c.replace(/;\s*Domain=[^;]*/gi, '; Domain=localhost')
       .replace(/;\s*SameSite=None/gi, '; SameSite=Lax')
    )

    // Forward response headers (skip hop-by-hop)
    for (const [key, value] of Object.entries(proxyRes.headers)) {
      if (key === 'set-cookie') continue
      if (!HOP_BY_HOP.has(key.toLowerCase()) && value !== undefined) {
        res.setHeader(key, value as string | string[])
      }
    }
    if (rewrittenCookies.length > 0) res.setHeader('set-cookie', rewrittenCookies)

    res.statusCode = proxyRes.statusCode ?? 502
    proxyRes.pipe(res, { end: true })
  })

  proxyReq.on('error', (err) => {
    console.error('[ory-proxy] upstream error:', err.message)
    if (!res.headersSent)
      res.status(502).json({ error: 'Ory proxy upstream error', detail: err.message })
  })

  req.pipe(proxyReq, { end: true })
}
```

> **Why not `@ory/integrations`?** The `createApiHandler` from `@ory/integrations` pulls in `istextorbinary` which crashes in Docker due to a Node.js `editions` autoloader incompatibility. The native `http` proxy above is dependency-free and more reliable.

---

## Phase 8 — Kratos Service and Config

### `src/features/auth/services/kratos-service.ts`

```typescript
import { FrontendApi, Configuration } from '@ory/client-fetch'

export const kratos = new FrontendApi(
  new Configuration({
    basePath: '/api/.ory',
    baseOptions: {
      withCredentials: true,
    },
  })
)
```

### `src/features/auth/services/ory-config.ts`

```typescript
import { OryClientConfiguration } from '@ory/elements-react'

// Self-hosted Kratos does not serve AccountExperienceConfiguration —
// build a minimal config from OryClientConfiguration.
const project = { name: 'Your App Name' } as OryClientConfiguration['project']

export const oryConfig: OryClientConfiguration = {
  sdk: { url: '/api/.ory' },
  project,
}
```

---

## Phase 9 — Flow Components

**CRITICAL design rule**: Use `window.location.href` (full-page browser navigation) to
**initiate** a new flow. Never call `createBrowser*Flow()` via SDK fetch — that follows
the 303 redirect to HTML and breaks. Only call `get*Flow({ id })` with the SDK, which
returns JSON.

The pattern for every flow component:

```typescript
useEffect(() => {
  if (!router.isReady) return
  if (flowId) {
    // Existing flow — fetch as JSON
    kratos.getXxxFlow({ id: String(flowId) })
      .then(setFlow)
      .catch(() => { window.location.href = '/api/.ory/self-service/xxx/browser' })
    return
  }
  // No flow — initiate via full-page browser navigation
  // Kratos sets cookie, redirects back to /xxx?flow=<id>
  window.location.href = '/api/.ory/self-service/xxx/browser'
}, [flowId, router])
```

### `src/features/auth/components/login-component.tsx`

```typescript
import { Login } from '@ory/elements-react/theme'
import { LoginFlow } from '@ory/client-fetch'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { kratos } from '../services/kratos-service'
import { oryConfig } from '../services/ory-config'

export const LoginComponent = () => {
  const router = useRouter()
  const [flow, setFlow] = useState<LoginFlow | null>(null)
  const { flow: flowId, return_to: returnTo } = router.query

  useEffect(() => {
    if (!router.isReady) return
    if (flowId) {
      kratos.getLoginFlow({ id: String(flowId) })
        .then(setFlow)
        .catch(() => {
          const qs = returnTo ? `?return_to=${encodeURIComponent(String(returnTo))}` : ''
          window.location.href = `/api/.ory/self-service/login/browser${qs}`
        })
      return
    }
    const qs = returnTo ? `?return_to=${encodeURIComponent(String(returnTo))}` : ''
    window.location.href = `/api/.ory/self-service/login/browser${qs}`
  }, [flowId, router, returnTo])

  if (!flow) return <div>Loading...</div>
  return <Login flow={flow} config={oryConfig} />
}
```

Generate equivalent components for:
- `registration-component.tsx` → `getRegistrationFlow` / `/self-service/registration/browser`
- `settings-component.tsx`     → `getSettingsFlow`     / `/self-service/settings/browser`
- `recovery-component.tsx`     → `getRecoveryFlow`     / `/self-service/recovery/browser`
- `verification-component.tsx` → `getVerificationFlow` / `/self-service/verification/browser`

---

## Phase 10 — Pages

### `pages/_app.tsx`

```typescript
import '../styles/globals.css'
import '@ory/elements-react/theme/styles.css'
import type { AppProps } from 'next/app'
import { OryConfigurationProvider } from '@ory/elements-react'

function MyApp({ Component, pageProps }: AppProps) {
  // as any required: @ory/elements-react v1.1.x omits 'children' in types
  const OryConfigProvider = OryConfigurationProvider as any
  return (
    <OryConfigProvider sdk={{ url: '/api/.ory' }}>
      <Component {...pageProps} />
    </OryConfigProvider>
  )
}
export default MyApp
```

Create thin page wrappers for:
- `pages/login.tsx` → `<LoginComponent />`
- `pages/registration.tsx` → `<RegistrationComponent />`
- `pages/settings.tsx` → `<SettingsComponent />`
- `pages/recovery.tsx` → `<RecoveryComponent />`
- `pages/verification.tsx` → `<VerificationComponent />`
- `pages/error.tsx` → display `router.query.error` message

---

## Phase 11 — Dockerfile (pnpm)

```dockerfile
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/next.config.* ./
USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
```

Ensure `next.config.*` has `output: 'standalone'`.

---

## Phase 12 — Downstream Service JWT Validation (ssr-frontend / ssr-backend)

After Oathkeeper authenticates a request, it forwards a signed JWT in
`Authorization: Bearer <token>`. Downstream services validate this JWT using
the **public** portion of `oathkeeper/jwks.json`.

### Extract the public JWKS

```bash
node -e "
const jwk = require('./oathkeeper/jwks.json').keys[0];
const pub = { kty: jwk.kty, use: jwk.use, kid: jwk.kid, n: jwk.n, e: jwk.e };
console.log(JSON.stringify({ keys: [pub] }, null, 2));
"
```

### Validate in Next.js middleware (`src/middleware.ts`)

```typescript
import { NextResponse, type NextRequest } from 'next/server'
import { createRemoteJWKSet, jwtVerify } from 'jose'

// Public JWKS URL — expose oathkeeper/jwks.json (public fields only)
// via a static route or embed inline. For local dev, use file directly.
const OATHKEEPER_ISSUER = process.env.OATHKEEPER_ISSUER ?? 'http://localhost:4455/'
const JWKS_URL          = process.env.OATHKEEPER_JWKS_URL ?? 'http://localhost:4456/.well-known/jwks.json'
const JWKS = createRemoteJWKSet(new URL(JWKS_URL))

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (pathname.startsWith('/_next/') || pathname === '/health') return NextResponse.next()

  const authHeader = request.headers.get('authorization') ?? ''
  const token = authHeader.replace(/^Bearer /, '')

  if (!token) {
    // No JWT — unauthenticated. Oathkeeper should have blocked this before
    // it reached here, but redirect as a safety net.
    const loginUrl  = process.env.NEXT_PUBLIC_LOGIN_URL ?? 'http://localhost:3000/login'
    const returnTo  = encodeURIComponent(request.url)
    return NextResponse.redirect(`${loginUrl}?return_to=${returnTo}`)
  }

  try {
    await jwtVerify(token, JWKS, { issuer: OATHKEEPER_ISSUER })
    return NextResponse.next()
  } catch {
    const loginUrl = process.env.NEXT_PUBLIC_LOGIN_URL ?? 'http://localhost:3000/login'
    const returnTo = encodeURIComponent(request.url)
    return NextResponse.redirect(`${loginUrl}?return_to=${returnTo}`)
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

Install `jose`: `pnpm add jose`

---

## Phase 13 — Verification Checklist

Run these after all files are in place:

```bash
# 1. Start all services
docker compose up -d

# 2. Wait for Kratos to be healthy
docker compose logs -f kratos | grep "Starting the public"

# 3. Verify proxy returns JSON (not 303 or HTML)
curl -s -H "Accept: application/json" \
  http://localhost:3000/api/.ory/self-service/registration/browser \
  | python3 -m json.tool | head -5

# 4. Verify form action points through proxy (not 127.0.0.1:4433)
curl -s -H "Accept: application/json" \
  http://localhost:3000/api/.ory/self-service/registration/browser \
  | python3 -c "import json,sys; print(json.load(sys.stdin)['ui']['action'])"
# Expected: http://localhost:3000/api/.ory/self-service/registration?flow=<uuid>

# 5. Verify Oathkeeper is running
curl -s http://localhost:4456/health/ready

# 6. Verify protected route redirects to login
curl -sI http://localhost:4455/app | grep -i location
# Expected: Location: http://localhost:3000/login?return_to=...
```

Open http://localhost:3000/registration in a browser and complete registration.

---

## Common Errors and Fixes

| Error | Cause | Fix |
|---|---|---|
| `SyntaxError: Unexpected token '<'` | Proxy missing `Accept: application/json`, SDK receives HTML | Don't call `createBrowserXxxFlow()` via SDK fetch; use `window.location.href` |
| `form action → http://127.0.0.1:4433/...` | `SERVE_PUBLIC_BASE_URL` not set to proxy URL | Set `SERVE_PUBLIC_BASE_URL=http://localhost:3000/api/.ory` in docker-compose |
| `aal2 required without session` | `show_verification_ui` hook fires after registration while AAL1 session cookie hasn't propagated | Remove `show_verification_ui` hook from registration `after` hooks |
| `None of the provided URLs returned a valid JSON Web Key Set` | `jwks.json` has placeholder/fake RSA key data | Regenerate with `node -e "...generateKeyPairSync..."` (see Phase 6) |
| `return_to not respected after login` | Oathkeeper redirect URL missing `return_to` param | Set `to: "http://localhost:3000/login?return_to={{ .URL \| urlquery }}"` in `rules.yml` |
| `haveibeenpwned` password rejected | HaveIBeenPwned check enabled in dev | Add `config: { haveibeenpwned_enabled: false }` under `selfservice.methods.password` in `kratos.yml` |
| `Cannot find module 'react'` in IDE | tsserver cache stale | Restart IDE / tsserver. Not a real build error — `tsc --noEmit` will pass |
| Cookies not set after login | `SameSite=None` or wrong domain in Set-Cookie | Proxy rewrites Set-Cookie to `Domain=localhost; SameSite=Lax` — ensure proxy is applied |
| `editions-autoloader-package` crash in Docker | `@ory/integrations` → `istextorbinary` incompatibility | Remove `@ory/integrations`; use the native Node.js proxy in Phase 7 |

---

## 2FA Setup Notes

### Email OTP (enabled by default with this config)

1. User logs in with password → Kratos prompts for email code (second factor)
2. Kratos sends code via Resend SMTP
3. User enters code → AAL2 session established

Enable in `kratos.yml`:
```yaml
selfservice:
  methods:
    code:
      enabled: true
      mfa_enabled: true
```

### TOTP (Google Authenticator / Authy)

1. User goes to `/settings` → "Two-Factor Authentication" section
2. Scans QR code with authenticator app
3. Future logins prompt for TOTP code after password

Enable in `kratos.yml`:
```yaml
selfservice:
  methods:
    totp:
      enabled: true
```

### SMS 2FA via Twilio (future — not enabled by default)

> **Warning**: Activating SMS as a Kratos credential identifier automatically
> makes it an enrolled MFA factor. All users with a phone number will have
> AAL2 required after next login. Plan migration carefully.

1. Add Twilio SDK: `pnpm add twilio`
2. Create a Kratos webhook that calls your `/api/send-sms` endpoint
3. Add `"ory.sh/kratos": { "credentials": { "code": { "identifier": true, "via": "sms" } } }` to the `phone` trait in `identity.schema.json`
4. Configure Kratos SMS courier: set `COURIER_SMS_*` environment variables pointing to your Twilio webhook

---

## Resend Setup

1. Create a free account at [resend.com](https://resend.com)
2. Verify your sender domain or use the Resend-provided test address
3. Generate an API key in the Resend dashboard
4. Set in `.env.local`:
   ```bash
   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
   KRATOS_FROM_EMAIL=auth@yourdomain.com
   ```
5. Verify emails flow: `docker compose logs -f kratos | grep courier`
