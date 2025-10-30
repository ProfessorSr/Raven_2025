# Changelog

## [0.3.0] - 2025-10-29
### Added
- Admin UI: **inline Create/Edit form** for Form Fields with client-side validation, `required` checkbox, select `options`, and live **Effective key** preview (sanitized).
- API: **Auto-assign `order_index`** on create (`max + 1`) in `form_fields` service to keep stable ordering.

### Changed
- API (admin controller): derive `key` from `label` if blank; strict validation + clearer 400 messages.
- API (admin controller): router-level body parsers (**json, urlencoded, text**), plus fallback **parse for text/plain** bodies.
- API (CORS): allow `Content-Type` and `x-admin-token`, include `OPTIONS`, and enable credentials for `http://localhost:3000`.
- Web: improved **Login** UX (show/hide password, disabled submit while loading, inline errors).

### Fixed
- “**key is required**” false negatives when browser sent `text/plain`.
- `form_fields.order_index NOT NULL` insert failures (now auto-assigned).
