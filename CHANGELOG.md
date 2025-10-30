# Changelog
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

---

## [Unreleased]
### Planned
- Supabase Auth integration (email/password + OAuth)
- Admin form builder UI for `form_fields` management
- Automated Supabase migration scripts
- Profile validation and attribute partitioning middleware
