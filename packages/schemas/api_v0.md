# Raven API v0 — Contract (Draft)

This document defines the initial HTTP API surface for Raven. It is *contract-first* and implementation-agnostic. Endpoints, payloads, and behaviors apply equally to web and native clients.

## 0) Conventions
- **Base URLs**: 
  - Non-Prod: `https://dev.api.raven.app`
  - Prod: `https://api.raven.app`
- **Versioning**: Prefix paths with `/v0`. Breaking changes bump to `/v1`.
- **Auth**:
  - **Web**: server-managed session cookie (httpOnly, Secure, SameSite=Lax/Strict).
  - **Mobile**: OIDC (Authorization Code + PKCE). Bearer access token in `Authorization: Bearer <token>`.
- **Pagination**: Cursor-based via `?after=<cursor>&limit=<n>`, default `limit=20`, max `50`.
- **Dates**: ISO 8601 UTC (e.g., `2025-10-28T12:34:56Z`).
- **Errors**: JSON: `{ "code": "string", "message": "human readable", "details": { ...? } }` with appropriate HTTP status codes.
- **Idempotency**: Mutating endpoints MAY accept `Idempotency-Key` header; if provided, servers SHOULD ensure idempotent behavior.

## 1) Auth & Sessions

### 1.1 Sign Up (email/password)
- **POST** `/v0/auth/signup`
- **Body**: `{ "email": "user@example.com", "password": "string", "acceptTerms": true }`
- **Responses**:
  - `201 Created` `{ "userId": "uuid", "requiresEmailVerification": true }`
  - `409 Conflict` email in use

### 1.2 Login (web session)
- **POST** `/v0/auth/login`
- **Body**: `{ "email": "user@example.com", "password": "string" }`
- **Behavior**: Sets httpOnly session cookie on success.
- **Responses**: `204 No Content` on success; `401` invalid creds.

### 1.3 Logout (web)
- **POST** `/v0/auth/logout`
- **Behavior**: Clears current session cookie.
- **Responses**: `204 No Content`

### 1.4 OIDC — Authorization Endpoint (mobile)
- **GET** `/v0/oauth2/authorize`
- **Query**: `client_id`, `redirect_uri`, `response_type=code`, `scope`, `state`, `code_challenge`, `code_challenge_method=S256`
- **Responses**: 302 redirect with `?code=...&state=...`

### 1.5 OIDC — Token Endpoint (mobile)
- **POST** `/v0/oauth2/token` (form-encoded)
- **Body** (authorization_code): `grant_type=authorization_code`, `code`, `redirect_uri`, `client_id`, `code_verifier`
- **Body** (refresh_token): `grant_type=refresh_token`, `refresh_token`, `client_id`
- **Responses**: `200` `{ "access_token": "...", "expires_in": 900, "refresh_token": "...", "token_type": "Bearer" }`

### 1.6 Email Verification
- **POST** `/v0/auth/verify-email`
- **Body**: `{ "code": "string" }`
- **Responses**: `204 No Content`

### 1.7 Password Reset
- **POST** `/v0/auth/forgot-password` Body: `{ "email": "..." }` → `204`
- **POST** `/v0/auth/reset-password` Body: `{ "code": "string", "newPassword": "string" }` → `204`

### 1.8 Logout (all devices)
- **POST** `/v0/auth/logout-all` → `204` (revokes all refresh tokens / sessions)

## 2) Users & Profiles

### 2.1 Get current user
- **GET** `/v0/me`
- **Auth**: web session or Bearer
- **Response** `200`:
```json
{ "user": { "id": "uuid", "email": "user@example.com", "createdAt": "2025-10-28T00:00:00Z" },
  "profile": { "id": "uuid", "displayName": "Raven", "avatarId": "mediaId|null", "bio": "string|null", "fields": {}, "visibility": "public|members|followers|custom" } }
```

### 2.2 Public profile by id
- **GET** `/v0/users/{id}` → `200` public-safe subset of profile

### 2.3 Update my profile
- **PATCH** `/v0/me/profile`
- **Body**: `{ "displayName?": "string", "bio?": "string", "avatarId?": "uuid", "fields?": { ... }, "visibility?": "public|members|followers|custom" }`
- **Response**: `200` updated profile

## 3) Media (private bucket with signed URLs)

### 3.1 Create media (request signed upload)
- **POST** `/v0/media`
- **Body**: `{ "type": "image|video|audio|file", "mime": "image/png", "size": 123456 }`
- **Response** `201`:
```json
{ "id": "uuid", "storageKey": "media/uuid/filename.ext", "uploadUrl": "https://...", "expiresAt": "2025-10-28T12:00:00Z" }
```

### 3.2 Finalize media (optional)
- **POST** `/v0/media/{id}/complete` → `204` (server may extract metadata, generate thumbnails)

### 3.3 Get media (signed access)
- **GET** `/v0/media/{id}` → `200` `{ "id": "uuid", "url": "https://signed-url", "mime": "image/png", "width?": 800, "height?": 600, "duration?": 0 }`

## 4) Posts & Comments

### 4.1 Feed
- **GET** `/v0/feed?after=<cursor>&limit=20`
- **Response** `200`:
```json
{ "items": [ { "type": "post", "id": "uuid", "authorId": "uuid", "text": "string", "attachments": ["mediaId"], "visibility": "public", "createdAt": "..." } ],
  "pageInfo": { "nextCursor": "cursor|null" } }
```

### 4.2 Create post
- **POST** `/v0/posts`
- **Body**: `{ "text": "string", "attachments": ["mediaId"], "visibility": "public|members|followers|custom" }`
- **Response** `201` `{ "id": "uuid" }`

### 4.3 Get post
- **GET** `/v0/posts/{id}` → `200` post object

### 4.4 Comment on post
- **POST** `/v0/posts/{id}/comments`
- **Body**: `{ "text": "string" }`
- **Response** `201` `{ "id": "uuid" }`

### 4.5 Reactions
- **POST** `/v0/posts/{id}/reactions`
- **Body**: `{ "type": "like" }`
- **Response** `204`

## 5) Notifications (phase 2 — placeholder)
- **GET** `/v0/notifications?after=&limit=` → list
- **POST** `/v0/notifications/{id}/read` → `204`

## 6) Common Error Codes
- `auth/invalid-credentials` → 401
- `auth/email-not-verified` → 403
- `auth/forbidden` → 403
- `auth/rate-limited` → 429
- `input/validation-error` → 422
- `resource/not-found` → 404
- `resource/conflict` → 409
- `server/error` → 500

## 7) Rate Limits (initial)
- `POST /auth/*`: 5/min per IP and account
- `POST /posts`: 60/min per user (burstable)
- `GET /*`: sensible defaults; server may return `429` with `Retry-After`

## 8) Security Notes
- CSRF protection required for cookie-auth endpoints (double submit or header token).
- All endpoints MUST require TLS (HTTPS).
- Access tokens MUST be short-lived (e.g., 900s). Refresh tokens are rotating and device-scoped.
- Media URLs are signed with short TTL; clients SHOULD NOT hotlink signed URLs permanently.

---

*Future: convert this to an OpenAPI v3 spec in `packages/schemas/openapi.yaml`, and generate typed clients for iOS/Android/Web.*
