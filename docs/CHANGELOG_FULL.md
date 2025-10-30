# Full Changelog
![version](https://img.shields.io/badge/version-v0.2.0-blue.svg)

## [0.2.0] - 2025-10-29
### Added
- Full Supabase Auth (email/password) signup + login integration
- Dynamic field-based registration via `/v0/form/registration`
- Profile API (`/v0/profile`) for fetching and updating user data
- Automatic session handling with secure `raven_session` cookie
- Dynamic validation engine for `form_fields`
- Enhanced CORS configuration for environment-driven origins
- Healthcheck and concurrent startup fully verified

### Changed
- Refactored backend modules to support form-driven registration and profiles
- Updated `auth/controller.stub.ts` and `auth/service.stub.ts` for Supabase session creation
- Improved `main.ts` to register `/v0/profile` routes
- Revised documentation and environment examples for developers
- Finalized stable build for `npm run start` and `npm run dev`

### Fixed
- Cookie persistence across endpoints (`signup` → `me` → `profile`)
- Database relation ordering issues during schema creation
- JSON parse and workspace setup errors in monorepo configuration

### Notes
- This release completes the backend foundation for Raven CMS.
- API now supports dynamic registration, authentication, and profile management.
- Marks transition from infrastructure to feature development.

## [Unreleased]
### Planned
- Supabase Auth integration (email/password + OAuth)
- Admin form builder UI for `form_fields` management
- Automated Supabase migration scripts
- Profile validation and attribute partitioning middleware

---

## [0.1.3] - 2025-10-29
### Added
- Completed full environment switching between **Supabase Dev** and **Supabase Prod** projects  
- Added consistent `.env.nonprod` and `.env.prod` configuration files across services  
- Introduced stable production startup via `npm run start` and `npm run start:prod`  
- Implemented final schema and RLS setup verification for both environments  
- Added clear `SUPABASE_URL` environment logging for visibility  
- Expanded changelog documentation with full project versioning workflow  
- Improved release management (CHANGELOG + GitHub release readiness)  

### Changed
- Updated `package.json` (root + services/api) for consistent environment handling and valid JSON  
- Enhanced root `npm run` commands for clean concurrent operation and production switching  
- Refactored startup behavior — `npm run dev` for dev mode, `npm run start` for prod mode  
- Improved `main.ts` route initialization ordering for stability and CORS safety  
- Reorganized release notes and changelog templates for future automation  

### Fixed
- Resolved `EJSONPARSE` errors caused by missing commas in `package.json`  
- Fixed `relation "public.form_fields" does not exist` errors by ensuring proper table creation order  
- Corrected Supabase connection misalignment (wrong project in environment file)  
- Eliminated workspace and Next.js config errors (`ENOWORKSPACES`, `MODULE_TYPELESS_PACKAGE_JSON`)  
- Fixed malformed startup scripts in monorepo root  

### Notes
- API and Web now run cleanly in both dev and prod environments concurrently.  
- Verified Supabase schema, policies, and endpoints are operational.  
- Repository structure, scripts, and documentation are now stable and production-ready.  
- Marks the official end of the *environment + infrastructure setup* phase.  

---

## [0.1.2] - 2025-10-29
### Added
- **Supabase integration:** connected to dev/prod projects with environment switching  
- Added `.env.nonprod` and `.env.prod` environment separation  
- Added **dynamic profiles** and **form_fields** schema (`profiles`, `form_fields` tables)  
- Added `/v0/form/registration` and `/v0/form/profile` endpoints  
- Added `services/api/src/modules/forms` and `services/api/src/modules/profiles` modules  
- Added `raven_profiles_configurable_forms.zip` package for reuse  

### Changed
- Updated `services/api/main.ts` to include `/v0/form` router  
- Updated `services/api/package.json` and root `package.json` for environment correctness and production scripts  
- Fixed `EJSONPARSE` errors by correcting `package.json` commas  
- Streamlined startup for **dev vs prod** modes (`npm run dev` vs `npm run start`)  

### Fixed
- Corrected RLS creation SQL (`IF NOT EXISTS` removal on policies)  
- Fixed missing comma in `services/api/package.json`  
- Resolved workspace-related `ENOWORKSPACES` and `MODULE_TYPELESS_PACKAGE_JSON` errors  

### Notes
- System now runs cleanly in both environments (dev/prod).  
- Database schema verified and seeded on both Supabase projects.  
- Healthcheck and dynamic forms endpoints operational.

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
