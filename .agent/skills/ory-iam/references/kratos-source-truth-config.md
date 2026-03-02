# Kratos Source-Truth Configuration Guide

> **CRITICAL RULE**: NEVER guess configuration keys in Kratos. If a key is not defined in the source code (`kratos/driver/config/config.go`), it will cause a CrashLoopBackOff when applied.

This guide provides the definitive list of valid configuration keys for Ory Kratos v1.3.1, mapped directly to their Go source code definitions in the `/Users/gqadonis/Projects/sansaba/kratos` repository.

## 1. Authentication Flows (`selfservice.flows.*`)

*Source: `driver/config/config.go` (Constants `ViperKeySelfService*` lines 116-153)*

| Flow | Valid Keys | Invalid / Common Mistakes |
| :--- | :--- | :--- |
| **Login** | `.ui_url`, `.style`, `.lifespan`, `.after`, `.before.hooks` | ❌ **`.requested_aal` is INVALID** for login flow in v1.3.1. It will crash the pod. |
| **Registration** | `.enabled`, `.login_hints`, `.style`, `.ui_url`, `.lifespan`, `.after`, `.before.hooks` | ❌ `.enable_legacy_one_step` is deprecated, use `.style` instead. |
| **Settings** | `.ui_url`, `.after`, `.before.hooks`, `.lifespan`, `.privileged_session_max_age`, **`.required_aal`** | ✅ `.required_aal` IS valid here, to protect the settings page itself. |
| **Recovery** | `.enabled`, `.use` (strategy like 'code'), `.ui_url`, `.lifespan`, `.after`, `.before.hooks`, `.notify_unknown_recipients` | |
| **Verification** | `.enabled`, `.use`, `.ui_url`, `.lifespan`, `.after`, `.before.hooks`, `.notify_unknown_recipients` | |
| **Error** | `.ui_url` | |
| **Logout** | `.after.default_browser_return_url` | |

## 2. Session Management (`session.*`)

*Source: `driver/config/config.go` (Constants `ViperKeySession*` lines 91-108)*

| Key | Description | Notes |
| :--- | :--- | :--- |
| `session.lifespan` | How long the session lasts | Default usually 24h. |
| `session.cookie.domain` | Cookie domain scoping | Vital for cross-subdomain auth (e.g., `.prometheusags.ai`). |
| `session.cookie.same_site` | SameSite policy | Must align with HTTPS/Secure settings. |
| `session.cookie.secure` | HTTPS only | `true` in production. |
| **`session.whoami.required_aal`** | **Enforces 2FA globally** | When set to `highest_available`, Kratos returns `403 session_aal2_required` from `/sessions/whoami` if session is AAL1 but user has 2FA enrolled. Thus, Oathkeeper blocks access to protected routes until 2FA is done. |

## 3. Second Factor & Authentication Methods (`selfservice.methods.*`)

*Source: `driver/config/config.go` (Struct `SelfServiceStrategyCode` line 240, Constants `ViperKeyCode*` line 169)*

When configuring email OTP (the `code` method), the flags for passwordless and MFA belong at the **ROOT** of the method, NOT inside config!

**Correct Structure (YAML):**

```yaml
selfservice:
  methods:
    code:
      enabled: true
      passwordless_enabled: false   # ✅ Correct: belongs to SelfServiceStrategyCode struct
      mfa_enabled: true             # ✅ Correct: belongs to SelfServiceStrategyCode struct
      config:
        lifespan: 15m               # ✅ belongs to config map
        max_submissions: 5          # ✅ belongs to config map
        missing_credential_fallback_enabled: true
```

*Source Confirmation*: Kratos Go structure maps JSON directly.

```go
type SelfServiceStrategyCode struct {
    *SelfServiceStrategy
    PasswordlessEnabled bool `json:"passwordless_enabled"`
    MFAEnabled          bool `json:"mfa_enabled"`
}
// Note: Config is embedded via *SelfServiceStrategy `json:"config"`
```

## 4. Courier & Email Templates (`courier.*`)

*Source: `driver/config/config.go` (Constants `ViperKeyCourier*` lines 56-84)*

| Key | Notes |
| :--- | :--- |
| `courier.smtp.connection_uri` | `smtp://user:pass@host:587/` (Use `smtp://` with port 587 and STARTTLS). |
| `courier.smtp.from_address` | Sender email. |
| `courier.smtp.from_name` | Sender name. |
| `courier.template_override_path` | Absolute path inside the pod to the localized templates directory (`/conf/courier-templates`). |

### Required Templates for Email OTP 2FA

* `login_code/valid/email.body.gotmpl` (HTML payload)
* `login_code/valid/email.body.plaintext.gotmpl` (Text payload)
* `login_code/valid/email.subject.gotmpl` (Subject line)

*(This also applies similarly to `recovery_code`, `verification_code`, and `registration_code`).*

## 5. Network & Proxy (`serve.*`)

*Source: `driver/config/config.go` (Lines 89-90)*

| Key | Source Status |
| :--- | :--- |
| `serve.public.base_url` | Valid |
| `serve.admin.base_url` | Valid |
| `serve.public.cors.allowed_origins` | Valid (special configuration) |
| ❌ `serve.public.trusted_proxy_ip_cidrs` | **INVALID** in v1.3.1 |
| ❌ `serve.public.trusted_client_ips` | **INVALID** in v1.3.1 |

**CSRF Proxy Warning**: In v1.3.1, missing trusted_proxy keys means Kratos relies strictly on standard X-Forwarded-* headers that must accurately reflect the browser's perceived proto (`https://`). Never enforce hardcoded HTTP proto rewriting at the app proxy layer.
