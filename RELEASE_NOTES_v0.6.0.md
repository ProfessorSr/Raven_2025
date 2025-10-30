## 🚀 Raven v0.6.0
This release stabilizes the authentication and admin systems.

### ✨ New Features
- Added full **logout** support (client + API).
- Integrated logout button in the header.
- Added **drag-and-drop reordering** in Admin → Forms.
- Improved dynamic signup form ordering sync.

### 🧩 Fixes & Improvements
- Fixed Supabase NOT NULL errors when reordering fields.
- Fixed CORS errors between web and API (`Accept` header handling).
- Improved Save Order UX with dirty-state hint.
- Hardened API body parsing for `text/plain` fallbacks.
- Dynamic field loading now respects correct `order_index`.

### 🔧 Developer Notes
- Commit includes both API (`formFields.service.ts`, `main.ts`) and Web (`admin/forms.tsx`, `api.ts`) updates.
- Tag created from stable dev branch state after full integration testing.

