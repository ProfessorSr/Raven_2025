# Raven Profiles & Dynamic Registration
This package adds:
- `profiles` table (with JSONB `attributes` for flexible custom fields)
- `form_fields` table to configure which fields appear on registration/profile forms
- REST endpoints to fetch field configs

## Contents
- `db/schema_profiles_forms.sql` — tables, triggers, RLS, indexes
- `db/seed_form_fields.sql` — default fields (display_name, first_name, favorite_color)
- `services/api/src/modules/forms/service.ts` — read form config
- `services/api/src/modules/forms/controller.ts` — HTTP endpoints
- `services/api/src/modules/profiles/service.ts` — upsert helper

## Install
1) **Run SQL** inside Supabase SQL editor (dev & prod projects):  
   - `db/schema_profiles_forms.sql`  
   - `db/seed_form_fields.sql` (optional)

2) **API dependencies** (from `services/api`):
```bash
npm install @supabase/supabase-js
```

3) **Mount routes** (in your `services/api/src/main.ts`):
```ts
import { router as formsRouter } from './modules/forms/controller';
app.use('/v0/form', formsRouter);
```

## Usage

### Get registration fields
```
GET /v0/form/registration
→ { "fields": [ { key, label, type, required, ... }, ... ] }
```

### Save profile on signup/edit
- Partition incoming payload into **core** vs **attributes** based on `form_fields.write_to`.
- Call `upsertProfile(userId, core, attributes)`.

## Notes
- RLS allows each user to `select/insert/update` only their own profile.
- `form_fields` is visible to all authenticated users (read-only); updates require service role.
- Add more defaults by inserting rows into `form_fields` — no code changes needed.
