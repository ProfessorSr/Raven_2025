# Auth Module — Flow Diagrams (Text)

## Web Login (cookie session)
User -> POST /v0/auth/login -> Server
Server -> Validate + create session -> Set-Cookie: raven.sid
Server -> 204

## Email Verification
User -> POST /v0/auth/verify-email { code } -> Server
Server -> Validate code -> Mark verified -> 204

## Mobile OIDC Code Flow
App -> GET /v0/oauth2/authorize (system browser) -> Server -> 302 redirect with code
App -> POST /v0/oauth2/token { code, code_verifier } -> Server
Server -> Create access/refresh tokens, device record -> 200 { access_token, expires_in, refresh_token }
