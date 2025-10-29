# Full Changelog
![version](https://img.shields.io/badge/version-v0.1.0-blue.svg)

## [Unreleased]
### Planned
- /v0/auth minimal implementation
- /v0/me endpoint
- Web app scaffold (Next.js)

---

## [0.1.1] - 2025-10-29
### Added
- Introduced **Quick Start (5 minutes)** section to README for faster onboarding
- Added **scripts/verify-setup.sh** for automated environment validation
- Added `npm run verify` script to simplify setup verification

### Changed
- Updated README to reflect **concurrent monorepo** workflow
  - Root-level `npm install` now installs all dependencies
  - `npm run dev` concurrently starts both API and Web servers
- Improved environment setup instructions for clarity and consistency

### Notes
- The repository is now fully streamlined for one-command setup and run.
- Verification script checks Node/npm versions, env files, ports, and required vars.

---

## [0.1.0] - 2025-10-29
### Added
- Stable working development environment (API + Web both running)
- Resolved workspace conflicts and verified concurrent run
- Updated Next.js to 14.1.0 with working App Router
- Finalized backend Express bootstrap
- Added TypeScript path aliases
- Implemented monorepo configuration with separate app and service
- Initial repository setup and folder structure
- Supabase integration (dev + prod projects)
- Environment variable scaffolding (.env.*)
- Documentation: API v0 contract, models, media policy, auth details, rate limits
- Backend scaffold (NestJS-style)
- Auth module docs and implementation checklist

### Notes
- This marks the first stable snapshot (v0.1.0).
- API runs on port 4000; Web app runs on port 3000.
