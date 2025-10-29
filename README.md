# Raven
![version](https://img.shields.io/badge/version-v0.1.0-blue.svg)
![status](https://img.shields.io/badge/status-stable-brightgreen.svg)

Raven is a **web + native iOS/Android social CMS** built for modern communities.
It provides a secure, modular system powered by Supabase Cloud for database and storage.

---

## ⚡ Quick Start (5 minutes)

```bash
# 1) Install all dependencies (API + Web)
npm install

# 2) Create local envs (one-time). At minimum set the API base URL for web:
echo "NEXT_PUBLIC_API_URL=http://localhost:4000" > apps/web/.env.local

# 3) Run both servers concurrently
npm run dev
```

- Web → http://localhost:3000  
- API → http://localhost:4000  (health: `/v0/health`)

---

## 🧩 Architecture Overview
- **API Service:** Express/NestJS hybrid backend (`services/api`)
  - Handles auth, profiles, media, posts, and social features
- **Web App:** Next.js 14+ frontend (`apps/web`)
  - Uses App Router and TypeScript for modern SSR/SPA experience
- **Native Apps:** Planned Swift/Kotlin implementations
- **Supabase:** Cloud-hosted Postgres + Storage for user data and media
- **Environments:** Non-Prod (staging) and Prod (live)
- **No Docker required**

---

## 🧱 Project Structure

See the full repository structure in [SITEMAP.md](./SITEMAP.md).

---

## 🚀 Getting Started

### Prerequisites

Before setting up Raven locally, ensure you have the following installed and configured:

- **Node.js** ≥ 18.17  
  - Recommended: [nvm](https://github.com/nvm-sh/nvm) (macOS/Linux) or [nvm-windows](https://github.com/coreybutler/nvm-windows)
  - macOS via Homebrew: `brew install node`
- **npm** ≥ 9 (bundled with Node.js)
- **Git** ≥ 2.30 — [Download Git](https://git-scm.com/downloads)
- **tree** CLI (used for sitemap generation)  
  - macOS: `brew install tree`  
  - Ubuntu/Debian: `sudo apt install tree`  
  - Fedora: `sudo dnf install tree`
- **Supabase account** with **two projects:**
  - `Raven dev` → Non-production (staging)
  - `Raven` → Production
  - Each project must have:
    - `SUPABASE_URL`
    - `SUPABASE_ANON_KEY`
    - `SUPABASE_SERVICE_ROLE_KEY`
    - `DATABASE_URL` (connection string)
- **Environment files (untracked):**
  - `services/api/.env.nonprod` → Dev keys
  - `services/api/.env.prod` → Prod keys
  - `apps/web/.env.local` → Client-side base config
- **Recommended Tools**
  - VS Code + extensions: Prettier, ESLint, TypeScript Hero
  - Optional: Postman for API testing

---

## 🛠️ Development Setup

> Raven is a concurrent monorepo — install once and run all together.

### 1) Clone the Repository
```bash
git clone https://github.com/yourusername/Raven.git
cd Raven
```

### 2) Install All Dependencies
Run this once from the repo root:
```bash
npm install
```
This installs dependencies for all workspaces automatically.

### 3) Configure Environment Variables

Create your local env files.

**`services/api/.env.nonprod`**
```bash
SUPABASE_URL=https://<your-dev-ref>.supabase.co
SUPABASE_ANON_KEY=<your-dev-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-dev-service-key>
DATABASE_URL=postgresql://postgres:password@db.<dev-ref>.supabase.co:5432/postgres

SESSION_SECRET=<generate-a-random-string>
TOKEN_SIGNING_KEY=<generate-another-random-string>
PORT=4000
COOKIE_DOMAIN=localhost
CORS_ORIGINS=http://localhost:3000
```

**`apps/web/.env.local`**
```bash
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### 4) Run Both Apps Concurrently
```bash
npm run dev
```
This will:
- Start the API → [http://localhost:4000](http://localhost:4000)
- Start the Web → [http://localhost:3000](http://localhost:3000)

### 5) Verify Setup
```bash
curl http://localhost:4000/v0/health
```

### 6) Run Verification Script
```bash
npm run verify
```

### 7) Stop Servers
Press `Ctrl + C` to stop both processes.

---

## 🧰 Troubleshooting

| Issue | Fix |
|------|-----|
| `tree: command not found` | Install it (`brew install tree` or `sudo apt install tree`) |
| `ENOWORKSPACES` / workspace errors | Run apps separately (`cd services/api && npm run dev`, `cd apps/web && npm run dev`) |
| Missing env vars | Ensure `.env.nonprod` (API) and `.env.local` (web) exist |
| CORS errors | Set `CORS_ORIGINS=http://localhost:3000` in `.env.nonprod` |
| Cookies not persisting | Use `localhost` (not 127.0.0.1) |
| Port conflict | Change API `PORT` and update `NEXT_PUBLIC_API_URL` |

---

## 🏷️ Version
Current release: **v0.1.0**  
See [docs/CHANGELOG_FULL.md](./docs/CHANGELOG_FULL.md).

---

## 📄 License
Currently private. License to be determined before public release.
