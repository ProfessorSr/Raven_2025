# Auth Module — Minimal Implementation Checklist

Implement these in order. Keep responses aligned with `packages/schemas/api_v0.md`.

## 0) Plumb basics
- [ ] Read env vars (SESSION_SECRET, TOKEN_SIGNING_KEY)
- [ ] Configure CORS for web (Non-Prod + Prod)
- [ ] Set JSON body size limits and request ID logging

## 1) Signup
- [ ] Route: POST /v0/auth/signup
- [ ] Validate email/password (length ≥ 10; breached-password check later)
- [ ] Create User + Profile records
- [ ] Hash password (Argon2id)
- [ ] Issue verification code and send email
- [ ] Return 201 { userId, requiresEmailVerification: true }

## 2) Login (web session)
- [ ] Route: POST /v0/auth/login
- [ ] Validate email/password
- [ ] Verify password and email status
- [ ] Create server session and set httpOnly cookie (SameSite=Lax, Secure)
- [ ] CSRF token endpoint or meta embedding (choose strategy)
- [ ] Return 204

## 3) Logout (web)
- [ ] Route: POST /v0/auth/logout
- [ ] Invalidate current session (server-side) and clear cookie
- [ ] Return 204

## 4) Verify Email
- [ ] Route: POST /v0/auth/verify-email
- [ ] Accept code, mark emailVerifiedAt, clear code
- [ ] Return 204

## 5) Password Reset
- [ ] Route: POST /v0/auth/forgot-password
- [ ] Generate reset code; send email
- [ ] Return 204
- [ ] Route: POST /v0/auth/reset-password
- [ ] Validate code; set new Argon2id hash; revoke all sessions
- [ ] Return 204

## 6) Mobile OIDC (scaffold only now)
- [ ] GET /v0/oauth2/authorize (validate client, redirect with code)
- [ ] POST /v0/oauth2/token (grant_type=authorization_code, refresh_token)
- [ ] Store device record with hashed refresh token; rotate on refresh
- [ ] Return { access_token, expires_in, refresh_token, token_type }

## 7) Me endpoint
- [ ] GET /v0/me
- [ ] Read session or Bearer token, return user + profile
- [ ] Return 200

## 8) Rate limiting
- [ ] Apply limits per docs to /auth/* and /oauth2/token
- [ ] Ensure consistent 429 responses

## 9) Telemetry
- [ ] Log signup/login/refresh/logout events with user/device IDs
- [ ] Redact sensitive fields
