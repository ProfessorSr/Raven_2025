# Raven Media & Storage Policy (Draft)

This document defines how clients upload, store, and access media in Raven. It is storage-provider agnostic and assumes Supabase Storage for the initial implementation.

## Goals
- Private-by-default storage with time-limited, signed access.
- Consistent upload flow for web and native clients.
- Room for later processing (thumbnails, transcodes, safety checks).

## Buckets
- **Bucket name:** `media`
- **Access:** Private (RLS ON). Public access is disabled.
- **Key format:** `media/{ownerId}/{mediaId}/{originalFilename}`

## Supported Types (initial)
- Images: `image/jpeg`, `image/png`, `image/webp`
- Video: `video/mp4` (more later)
- Audio: `audio/mpeg`, `audio/aac` (later)
- Files: limited document types if needed (later)

## Size Limits (initial)
- Images: up to 10 MB
- Video: up to 200 MB (subject to change)
- Audio: up to 50 MB
- Server MAY reject with `413 Payload Too Large` (expose limits on `/v0/media/policy`).

## Upload Flow (Signed PUT)
1. **Client** requests an upload session:

   - `POST /v0/media` with `{ type, mime, size }`.

   - **Server** creates a `Media` record with `status=pending` and returns:

     ```json

     { "id": "uuid", "storageKey": "media/<owner>/<id>/<filename>", "uploadUrl": "https://...", "expiresAt": "..." }

     ```

2. **Client** performs **PUT** directly to storage using `uploadUrl`.

3. **Client** MAY call `POST /v0/media/{id}/complete` to signal finish (optional; server can also verify with a HEAD on the object).

4. **Server** marks media `status=ready` after verifying object exists; MAY extract metadata (width/height/duration, mime, size).


## Access Flow (Signed GET)
- **GET /v0/media/{id}** returns a short-lived, signed URL for the object and metadata.

- Clients SHOULD NOT cache signed URLs beyond their TTL; re-fetch when needed.


## Deletion
- **Owner** or **admins** may delete media.

- Deleting a `Post` SHOULD soft-delete or detach associated `Media` records; background job performs hard-delete from storage.


## Safety & Compliance (later phases)

- **Virus scan** for documents (if allowed).

- **NSFW detection** for images/video (optional mode).

- **Copyright** checks on flagged content.

- **Retention** policy and hard-deletion windows configurable per environment.


## CDN & Performance

- Use a CDN in front of storage for GETs when possible.

- Image transforms via CDN or on-demand (e.g., width/quality params) — keep originals immutable.

- Set caching headers appropriately; signed URLs SHOULD include cache-busting when needed.


## Error Handling

- Return structured errors `{ code, message, details? }`.

- Map storage failures to `resource/not-found`, `resource/conflict`, or `server/error` as appropriate.


## Telemetry

- Log upload attempts, sizes, mime types, and outcomes.

- Emit events: `media.created`, `media.ready`, `media.failed`, `media.deleted`.

