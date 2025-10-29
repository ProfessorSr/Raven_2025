# Auth Validation Policy (Draft)

## Email
- RFC-compliant format
- Normalize case on storage, preserve original case for display
- Require verification before content posting

## Password
- Min length 10
- Encourage passphrases; no complex composition rules
- Check against breached-password corpus (k-anonymity API) — later phase

## Codes
- Random, single-use, 15-minute TTL for verify/reset
- Store hashes of codes, not plaintext

## Device
- Accept `platform` (ios|android|web) and optional appVersion
- Hash refresh tokens; rotate on /token refresh
