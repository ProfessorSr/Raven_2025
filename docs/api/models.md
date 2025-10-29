# Raven Data Models — Outline (Draft)

This document defines high-level, implementation-agnostic data models for Raven API v0. Field names and shapes guide API contracts; actual storage schemas may differ.

## Conventions
- IDs are **UUIDv4** unless noted.
- Timestamps are **ISO 8601 UTC** (`createdAt`, `updatedAt`).
- `visibility`: `public | members | followers | custom`.
- Nullable fields are marked `?`.
- Arrays shown as `[Type]`.

---

## User
Represents account identity and security properties.
- `id: UUID`
- `email: string`
- `emailVerifiedAt?: string`
- `status: "active" | "suspended" | "deleted"`
- `createdAt: string`
- `updatedAt: string`

### Derived / server-managed
- `passwordHash` (server-only)
- `mfaEnabled: boolean`
- `mfaMethods?: ["totp", "webauthn"]`

---

## Profile
Public-facing user information, decoupled from User for privacy and customization.
- `id: UUID`
- `userId: UUID`
- `displayName: string`
- `avatarId?: UUID`  (references Media)
- `bio?: string`
- `fields?: object`  (custom fields map; e.g., location, links)
- `visibility: "public" | "members" | "followers" | "custom"`
- `createdAt: string`
- `updatedAt: string`

---

## Device / Session
Tracks device-scoped refresh tokens and session metadata.
- `id: UUID`
- `userId: UUID`
- `deviceInfo: { platform: "ios" | "android" | "web" | "other", model?: string, osVersion?: string, appVersion?: string }`
- `lastSeenAt: string`
- `revokedAt?: string`

### Server-only
- `refreshTokenHash: string`
- `ipAddress?: string`
- `userAgent?: string`

---

## Media
Represents an uploaded asset stored in the `media` bucket.
- `id: UUID`
- `ownerId: UUID`  (user who owns it)
- `type: "image" | "video" | "audio" | "file"`
- `mime: string`
- `size: number`
- `storageKey: string`  (path/key in bucket)
- `width?: number`
- `height?: number`
- `duration?: number`
- `status: "pending" | "ready" | "failed"`
- `createdAt: string`

### Access
- Delivered via **signed URLs** (short TTL) or proxied by server.

---

## Post
A user-authored piece of content that may include media attachments.
- `id: UUID`
- `authorId: UUID`
- `text?: string`
- `attachments?: [UUID]`  (Media ids)
- `visibility: "public" | "members" | "followers" | "custom"`
- `createdAt: string`
- `updatedAt: string`

### Counters (eventually consistent)
- `reactions: { like: number }`
- `commentsCount: number`

---

## Comment
Comment on a post (supports flat or threaded via parentId).
- `id: UUID`
- `postId: UUID`
- `authorId: UUID`
- `text: string`
- `parentId?: UUID`  (for threading)
- `createdAt: string`

---

## Notification (Phase 2 placeholder)
- `id: UUID`
- `userId: UUID`
- `type: string`  (e.g., "mention", "reply", "like")
- `payload: object`
- `readAt?: string`
- `createdAt: string`

---

## Error Shape (shared)
Returned on non-2xx responses.
- `code: string`            (machine-readable)
- `message: string`         (human-readable)
- `details?: object`

---

## Pagination (shared)
Cursor-based structure.
- `items: [T]`
- `pageInfo: { nextCursor?: string }`

---

## Security / Privacy Notes
- Personally identifiable information (email, IP, device) is never exposed to other users via the API.
- Access control is enforced uniformly via `visibility` and the requesting principal (web session or token).
- Media access uses signed URLs with short TTLs; clients must re-fetch URLs as needed.
