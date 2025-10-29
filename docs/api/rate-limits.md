# Raven Rate Limits & Abuse Controls (Draft)

This document centralizes request limits, abuse protections, and enforcement guidance for Raven API v0.

## Goals
- Protect auth endpoints and resource creation from brute-force and spam.
- Keep read endpoints available and fair with sensible per-user/IP ceilings.
- Provide consistent responses and headers on throttling.

## General Principles
- Rate limits are evaluated by **identity** (userId/device) and **network** (IP or /24 block).
- On limit breach:
  - Return `429 Too Many Requests`
  - Include `Retry-After` (seconds) and optionally `X-RateLimit-*` headers
- Progressive backoff for repeat offenders (cooldowns grow on consecutive breaches).
- Trusted admin/service accounts may have separate higher ceilings.

## Baseline Limits (v0)
Values are starting points; adjust per environment.

### Authentication
- **POST /v0/auth/signup**: 5/min per IP and 3/hour per email
- **POST /v0/auth/login**: 10/min per IP and 10/min per account
- **POST /v0/oauth2/token (authorization_code)**: 20/min per device
- **POST /v0/oauth2/token (refresh_token)**: 30/min per device
- **POST /v0/auth/forgot-password**: 3/hour per email and 10/hour per IP
- **POST /v0/auth/reset-password**: 5/hour per user

### Profiles
- **PATCH /v0/me/profile**: 20/hour per user

### Media
- **POST /v0/media**: 30/min per user; max cumulative upload size 1 GB/hour per user (soft cap)
- **GET /v0/media/:id**: 300/min per user; 100/min per IP for anonymous

### Posts & Comments
- **POST /v0/posts**: 60/min per user (burstable), 600/day soft cap
- **POST /v0/posts/:id/comments**: 120/min per user, 1,000/day soft cap
- **POST /v0/posts/:id/reactions**: 300/min per user

### Reads (general)
- **GET /v0/***: 300/min per user; 120/min per IP for anonymous

## Abuse Detection (Signals)
- Excessive failed logins or password resets
- High-velocity posting or media creation from new accounts
- Multiple accounts from a single IP / device fingerprint
- Reuse of refresh tokens (token replay)
- Suspicious media MIME/size patterns

## Responses & Headers
- `429 Too Many Requests`
- Headers:
  - `Retry-After: <seconds>`
  - `X-RateLimit-Limit: <limit>` (optional)
  - `X-RateLimit-Remaining: <remaining>` (optional)
  - `X-RateLimit-Reset: <epoch-seconds>` (optional)

## Exemptions & Overrides
- Admin/service accounts may receive elevated limits.
- Internal health checks exempt where appropriate.

## Temporary Blocks
- Automatic temporary blocks may be applied based on abuse signals.
- Return consistent error: `{ "code": "auth/rate-limited", "message": "Too many requests. Try again later." }`

## Captcha Escalation (Optional)
- When thresholds are repeatedly exceeded, require Captcha challenge before allowing further requests.
- Provide a distinct error code: `auth/captcha-required`.

## Logging & Monitoring
- Log all 429 responses with identity & IP (hashed/truncated), endpoint, and window stats.
- Alert on spikes or sustained high 429 rates.

## Environment Tuning
- **Non-Prod**: relaxed limits for testing.
- **Prod**: start with baseline; adjust using telemetry.
