# Raven API Service (Scaffold)

This is the backend service for Raven. It uses a NestJS-style modular layout.
These files are **stubs only** (comments & READMEs) — no implementation yet.

## Notes
- Env files live here (not committed): `.env.nonprod`, `.env.prod`
- Connects to Supabase (DB + Storage) using values from your env files
- Exposes `/v0/*` HTTP endpoints per `packages/schemas/api_v0.md`

## Next
- Fill in `src/main.ts` and `src/app.module.ts`
- Implement modules under `src/modules/*` starting with `auth`, `users`, `profiles`
