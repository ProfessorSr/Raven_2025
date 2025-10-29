# Raven Auth Details — Addendum (Draft)

This addendum deepens the authentication and session model for Raven across Web (cookie sessions) and Mobile (OIDC Authorization Code + PKCE).

## 1) Token & Session Lifetimes
- **Access Token (mobile)**: 15 minutes (900 seconds). Short TTL minimizes risk.
- **Refresh Token (mobile)**: 30 days max lifetime, **rotating** on each refresh. Server stores **hashed** refresh tokens.
- **Web Session Cookie**: 7 days idle timeout (sliding). Server-side session store.
- **Email Verification Codes**: 15 minutes TTL, single-use.
- **Password Reset Codes**: 15 minutes TTL, single-use.
- **Device Records**: expire 90 days after last activity (soft delete).

## 2) Web Session (Cookies)
- **Cookie Name**: `raven.sid`
- **Attributes**: `HttpOnly; Secure; SameSite=Lax` (Strict for highly sensitive views).
- **Domain**: set to the effective site domain (e.g., `.raven.app`).
- **CSRF**: double-submit or header token strategy:
  - Server issues CSRF token via meta tag or `/v0/auth/csrf` endpoint.
  - State-changing requests require `X-CSRF-Token` header.
- **Logout**: `POST /v0/auth/logout` clears cookie and invalidates server session.

## 3) Mobile OAuth 2.1 / OIDC (Code + PKCE)
- **Authorization Endpoint**: `/v0/oauth2/authorize`
- **Token Endpoint**: `/v0/oauth2/token`
- **Issuer (iss)**: `https://{env}.api.raven.app`
- **Supported Grant Types**: `authorization_code`, `refresh_token`
- **PKCE**: S256 only
- **Scopes** (initial): `openid profile email offline_access`
- **Client**: Public client (`raven-mobile`) with **no client secret** (mobile apps keep no secrets).
- **Redirect URI**: `raven://auth/callback` (per-platform native scheme)
- **Refresh Rotation**:
  - Each refresh **invalidates the previous** token.
  - If a refresh token is reused, **revoke the device** and require re-login.

## 4) Device-Scoped Sessions
- Each mobile login creates a **Device** record containing:
  - `platform`: `ios` | `android` | `web`
  - `model?`, `osVersion?`, `appVersion?`
  - `refreshTokenHash`, `lastSeenAt`, `ipAddress?`, `userAgent?`
- Users can list and revoke devices via future endpoints:
  - `GET /v0/me/devices`
  - `POST /v0/me/devices/{id}/revoke` → `204`

## 5) Brute-force & Abuse Protections
- **Rate limits**:
  - `POST /v0/auth/login` & `/signup`: **5/min per IP & account**
  - `POST /v0/oauth2/token` (refresh): **30/min per device**
- **Progressive delays** after repeated failures (backoff).
- **Breached password** check on signup/reset (HIBP-style hash comparison).
- **IP reputation** (optional) for high-risk traffic.
- **Captcha** (optional) when thresholds exceeded.

## 6) Password Policy
- Minimum length 10, encourage passphrases.
- Disallow commonly breached passwords.
- No composition rules beyond length (avoid UX friction), but encourage entropy meter.

## 7) Email Flow Requirements
- **Signup** sends verification email; posting or DMs require verified email.
- **Change email** requires password re-auth and verification.
- **Reset password** invalidates all existing sessions/tokens.

## 8) Security Headers & CORS
- **CORS (API)**: allow origins:
  - Non-Prod: `http://localhost:*`, `https://dev.raven.app`, `https://dev.api.raven.app`
  - Prod: `https://raven.app`, `https://api.raven.app`
  - Allow credentials for web session flow where necessary.
- **Recommended headers (API responses)**:
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- **Content-Security-Policy (Web)** (starter):
  - `default-src 'self'; img-src 'self' data: blob: https:; media-src 'self' blob: https:; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://dev.api.raven.app https://api.raven.app;`

## 9) Error Model & Codes (Auth-specific)
- `auth/invalid-credentials` → 401
- `auth/email-not-verified` → 403
- `auth/forbidden` → 403
- `auth/rate-limited` → 429
- `auth/invalid-code` → 400 (verify/reset)
- `auth/invalid-refresh` → 401 (rotation fail)
- `auth/device-revoked` → 401

## 10) OIDC Discovery (Well-Known) — Later Enhancement
Expose standard metadata for clients:
- `GET /.well-known/openid-configuration`
- Includes `issuer`, `authorization_endpoint`, `token_endpoint`, `jwks_uri`, `scopes_supported`, `code_challenge_methods_supported`, etc.

## 11) Logging & Audit
- Log auth events (signup, login success/fail, token refresh, logout, device revoke) with userId, deviceId, IP (hashed or truncated), and timestamps.
- Admin audit log for privileged actions.

---

*This addendum complements `docs/auth/flows.md`. Once stable, we will promote it into an OpenID Connect discovery document and an explicit policy page for clients.*
