# Oathkeeper Source-Truth Configuration Guide

> **CRITICAL RULE**: ALWAYS map your Oathkeeper configuration to these Go structs. If a key is not defined in these structs from the source code (`/Users/gqadonis/Projects/sansaba/oathkeeper`), it is INVALID and will cause routing failures.

This guide provides the definitive list of valid configuration keys for Ory Oathkeeper, mapped directly to their Go source code definitions.

## 1. Access Rule Schema (`rule.Rule`)

*Source: `rule/rule.go:88`*

Each file in your rules directory (e.g., `access-rules.yml`) is an array of these objects:

```yaml
id: "unique-string"
version: "v0.40.6"
description: "Human readable description"
match:
  url: "https://mydomain.com/<*>"  # Use <.*> for regex, <*> for glob
  methods: ["GET", "POST"]
authenticators: []
authorizer: {}
mutators: []
errors: []
upstream: {}
```

### Match (`rule.Match`)

*Source: `rule/rule.go:18`*

* `url` (string): The URL pattern (supports `<*>` glob or `<.*>` regex depending on engine).
* `methods` ([]string): e.g., `["GET", "POST", "OPTIONS"]`.

### Upstream (`rule.Upstream`)

*Source: `rule/rule.go:132`*

* `url` (string): The backend URL to proxy to.
* `preserve_host` (boolean): If `true`, the original `Host` header is sent to the upstream. If `false` (default), the `Host` header is set to the upstream's URL hostname.
* `strip_path` (string): Replaces the provided prefix when forwarding.

## 2. Authenticators (`pipeline.authn`)

### `cookie_session`

*Source: `pipeline/authn/authenticator_cookie_session.go:38`*

```yaml
handler: cookie_session
config:
  check_session_url: "http://kratos-public/sessions/whoami"
  only: ["ory_kratos_session"]
  preserve_path: true
  preserve_query: true
  subject_from: "identity.id"
  extra_from: "identity.traits"
  forward_http_headers: ["Authorization", "Cookie"]
  force_method: "GET"
```

### `anonymous`

*Source: `pipeline/authn/authenticator_anonymous.go:18`*

* `subject` (string): The subject assigned (e.g., `"anonymous"`).

### `bearer_token`

*Source: `pipeline/authn/authenticator_bearer_token.go:18`*

* `check_session_url` (string)
* `preserve_path` / `preserve_query` / `preserve_host` (bool)
* `subject_from` / `extra_from` (string)
* `forward_http_headers` ([]string)

## 3. Authorizers (`pipeline.authz`)

### `allow` and `deny`

* No specific configuration struct. Just `handler: allow` or `handler: deny`.

## 4. Mutators (`pipeline.mutate`)

### `id_token` (JWT generation)

*Source: `pipeline/mutate/mutator_id_token.go:45`*

```yaml
handler: id_token
config:
  issuer_url: "https://oathkeeper.example.com"
  jwks_url: "file:///etc/secrets/jwks.json" # Or HTTP endpoint
  ttl: "1h"
  claims: |
    {
      "session": {{ .Extra | toJson }},
      "email": "{{ print .Extra.email }}"
    }
```

* `claims` (string): Go template string generating JSON.
* `issuer_url` (string): Sets the `iss` claim.
* `jwks_url` (string): Where Oathkeeper loads its signing keys.
* `ttl` (string): Token exact lifespan (e.g., `1h`, `15m`).

### `noop`

* No specific configuration struct. Just forwards requests as-is.

### `header`

*Source: `pipeline/mutate/mutator_header.go:21`*

* `headers` (map[string]string): Key-value pairs of headers to inject, supports Go templates.

## 5. Error Handlers (`pipeline.errors`)

### `redirect`

*Source: `pipeline/errors/error_redirect.go:26`*

```yaml
handler: redirect
config:
  to: "https://auth.example.com/login"
  code: 302
  return_to_query_param: "return_to"
```

* `to` (string): URL to redirect to.
* `code` (int): HTTP status code (must be 301 or 302).
* `return_to_query_param` (string): **CRITICAL for Auth Flows.** If set (e.g., `return_to`), Oathkeeper appends the original requested URL to the redirect target. This prevents infinite redirect loops and enables deep linking after login.

### `json`

*Source: `pipeline/errors/error_json.go:21`*

* `verbose` (boolean): If `true`, includes detailed error reasons in the JSON response payload.
