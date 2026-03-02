# Ory IAM Cloud Infrastructure Guide: Azure, GCP, & AWS

> **META-THEORY**: Identity infrastructure relies heavily on the network topology. A misconfigured cloud load balancer or ingress controller can break CSRF protections, trigger infinite redirect loops, or strip essential cookies. Because Oathkeeper and Kratos validate the request source intrinsically, you must understand how your chosen cloud provider manipulates HTTP layers 4 and 7.

This guide details the specific architectures, hints, and gotchas for deploying Ory Kratos and Oathkeeper across the three major public clouds.

---

## 1. Microsoft Azure (AKS & AppGateway)

**Strategy Location**: Kubernetes (AKS) behind Azure Application Gateway Ingress Controller (AGIC) or Azure Front Door.

### Essential Theory

Azure Application Gateway acts as a Layer 7 proxy. By default, it manages SSL termination and adds `X-Forwarded-*` headers.

### Gotchas & Hints

* **Health Probes:** AGIC requires specific health probe paths to return `200 OK`. Oathkeeper's `/health/ready` and Kratos' `/health/ready` must be explicitly configured in the Ingress annotations, otherwise Azure marks the backend pool as dead.
  * *Annotation:* `appgw.ingress.kubernetes.io/health-probe-path: "/health/ready"`
* **Cookie Affinity:** Azure AppGateway can inject an `ARRAffinity` cookie to bind sessions to a backend pod. **Turn this OFF.** Kratos sessions are stored in the database, and Oathkeeper is stateless. Affinity breaks round-robin scaling and adds unnecessary cookie bloat.
  * *Annotation:* `appgw.ingress.kubernetes.io/cookie-based-affinity: "false"`
* **Multi-Subdomain CORS:** If Front Door is used, it aggressively caches. Ensure CORS preflight `OPTIONS` requests are NOT cached by Azure Front Door, or Oathkeeper will reject valid CORS requests.
* **Trust Rules:** Kratos *must* trust the internal Azure VNet IP range for the App Gateway. Set `serve.public.trusted_proxy_ip_cidrs` in Kratos or let it fallback to trusting the `X-Forwarded-Proto` originating from the AppGateway. *(Note: in v1.3.1, `trusted_proxy_ip_cidrs` was removed/handled differently based on the source config audit; instead rely on correct AppGateway header forwarding!)*

---

## 2. Google Cloud Platform (GCP - GKE)

**Strategy Location**: Google Kubernetes Engine (GKE) behind a Google Cloud Load Balancer (GCLB).

### GCP Essential Theory

GCP Load Balancers are highly globally distributed. Traffic often hops between Google edge nodes before reaching your cluster. GCLB uses a strict health-check protocol that is decoupled from Kubernetes readiness probes.

### GCP Gotchas & Hints

* **Health Check Desync:** A common GKE gotcha is that the GCLB health check (automatically created by the Ingress object) defaults to `/`. Neither Kratos nor Oathkeeper serve `200 OK` at `/`. You MUST use BackendConfig CRDs (Custom Resource Definitions) in GCP to point the Load Balancer health check to `/health/ready`.
* **IAP (Identity-Aware Proxy) Conflicts:** If you use Google IAP to protect an internal dashboard, it injects its own headers (`x-goog-iap-jwt-assertion`). Do not let Oathkeeper's mutators overwrite this if you are chaining auth.
* **Cloud Armor (WAF):** If placing Cloud Armor in front of Kratos, be careful with rate-limiting rules on the login flow. Cloud Armor can falsely flag Kratos' CSRF token cookies or the length of the webauthn payloads as malicious.
* **HTTP-to-HTTPS Redirects:** GCLB manages this at the edge via a FrontendConfig. Do NOT configure Nginx or Oathkeeper to handle HTTP-to-HTTPS redirects. The edge MUST terminate SSL and send HTTP to the cluster, along with `X-Forwarded-Proto: https`.

---

## 3. Amazon Web Services (AWS - EKS)

**Strategy Location**: Elastic Kubernetes Service (EKS) behind an Application Load Balancer (ALB) provisioned via the AWS Load Balancer Controller.

### AWS Essential Theory

AWS ALBs are deeply integrated with Route53 and ACM (Amazon Certificate Manager). ALBs evaluate path-based routing before the request ever hits your cluster ingress.

### AWS Gotchas & Hints

* **Target Group Binding:** The AWS LB Controller binds IAM components into Target Groups. Ensure your Kratos public, Kratos admin, and Oathkeeper proxy are in separate target groups if you need different WAF policies.
* **Header Dropping (CRITICAL):** ALBs silently drop headers containing underscores (`_`) by default. If your client or Oathkeeper mutator generates a custom header like `x_ory_tenant`, the ALB will delete it before it hits the backend backend. Always use dashes (`-`), e.g., `X-Ory-Tenant`.
* **ALB Stickiness:** Similar to Azure, ALBs support sticky sessions via a generated `AWSALB` cookie. Disable this. Oathkeeper and Kratos are designed to be horizontally scaled without session stickiness.
* **ACM Certificate Termination:** SSL terminates at the ALB. Therefore, Oathkeeper and Kratos will see HTTP traffic on port 80 or 8080. You must ensure Kratos receives `X-Forwarded-Proto: https`, otherwise, Kratos will set its Anti-CSRF cookies with the `Secure` flag missing (or reject them entirely), causing the dreaded "CSRF Cookie not found" redirect loop during login.
* **WAF Rule Limits:** AWS WAF's default core rule set blocks payload sizes larger than 8KB. If you are uploading large JSON Identity schemas during registration, WAF may return a 403 Forbidden.

---

## Architectural Constants Across ALL Cloud Providers

Regardless of Azure, GCP, or AWS, adhere to these theoretical absolutes:

1. **Edge SSL Termination:** Let your cloud provider's managed load balancer terminate SSL.
2. **Reverse Proxy Headers:** `X-Forwarded-For`, `X-Forwarded-Host`, and `X-Forwarded-Proto` are non-negotiable. If your load balancer strips or modifies these, Kratos' CSRF generation and Oathkeeper's redirect evaluators will fail.
3. **Internal vs External Exposure:** Kratos Admin API (port 4434) MUST NEVER be exposed to an external Load Balancer or Ingress. It must remain ClusterIP only. Oathkeeper is the only public-facing barrier.
