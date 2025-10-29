# Raven Repository Structure

```
.
├── apps
│   ├── android
│   │   ├── .env.example
│   │   └── README.md
│   ├── ios
│   │   ├── .env.example
│   │   └── README.md
│   ├── web
│   │   ├── src
│   │   │   └── app
│   │   │       ├── login
│   │   │       │   └── page.tsx
│   │   │       ├── signup
│   │   │       │   └── page.tsx
│   │   │       ├── layout.tsx
│   │   │       └── page.tsx
│   │   ├── .env.local
│   │   ├── .env.local.example
│   │   ├── .env.nonprod
│   │   ├── .env.prod
│   │   ├── next-env.d.ts
│   │   ├── next.config.js
│   │   ├── package.json
│   │   ├── README.md
│   │   └── tsconfig.json
│   ├── .DS_Store
│   └── .env.local.example
├── db
│   ├── schema_profiles_forms.sql
│   └── seed_form_fields.sql
├── docs
│   ├── api
│   │   ├── media-policy.md
│   │   ├── models.md
│   │   ├── rate-limits.md
│   │   └── resources.md
│   ├── auth
│   │   ├── auth-details.md
│   │   └── flows.md
│   ├── product
│   │   └── mission.md
│   └── CHANGELOG_FULL.md
├── infra
│   └── docs
│       └── environments.md
├── packages
│   ├── design
│   │   └── README.md
│   ├── schemas
│   │   ├── api_v0.md
│   │   └── README.md
│   └── .DS_Store
├── schemas
│   └── api_v0.md
├── scripts
│   ├── update-sitemap.sh
│   └── verify-setup.sh
├── services
│   ├── api
│   │   ├── src
│   │   │   ├── common
│   │   │   │   ├── errors
│   │   │   │   │   └── README.md
│   │   │   │   ├── middleware
│   │   │   │   │   └── README.md
│   │   │   │   ├── types
│   │   │   │   │   └── README.md
│   │   │   │   └── README.md
│   │   │   ├── config
│   │   │   │   └── README.md
│   │   │   ├── db
│   │   │   │   └── README.md
│   │   │   ├── modules
│   │   │   │   ├── auth
│   │   │   │   │   ├── docs
│   │   │   │   │   │   ├── endpoint-checklist.md
│   │   │   │   │   │   ├── sequence-diagrams.md
│   │   │   │   │   │   └── validation-policy.md
│   │   │   │   │   ├── dto
│   │   │   │   │   │   └── README.md
│   │   │   │   │   ├── controller.stub.ts
│   │   │   │   │   ├── README.md
│   │   │   │   │   └── service.stub.ts
│   │   │   │   ├── comments
│   │   │   │   │   ├── controller.stub.ts
│   │   │   │   │   ├── README.md
│   │   │   │   │   └── service.stub.ts
│   │   │   │   ├── forms
│   │   │   │   │   ├── controller.ts
│   │   │   │   │   └── service.ts
│   │   │   │   ├── media
│   │   │   │   │   ├── controller.stub.ts
│   │   │   │   │   ├── README.md
│   │   │   │   │   └── service.stub.ts
│   │   │   │   ├── posts
│   │   │   │   │   ├── controller.stub.ts
│   │   │   │   │   ├── README.md
│   │   │   │   │   └── service.stub.ts
│   │   │   │   ├── profiles
│   │   │   │   │   ├── controller.stub.ts
│   │   │   │   │   ├── README.md
│   │   │   │   │   ├── service.stub.ts
│   │   │   │   │   └── service.ts
│   │   │   │   ├── users
│   │   │   │   │   ├── controller.stub.ts
│   │   │   │   │   ├── README.md
│   │   │   │   │   └── service.stub.ts
│   │   │   │   └── README.md
│   │   │   ├── routes
│   │   │   │   └── README.md
│   │   │   ├── app.module.ts
│   │   │   └── main.ts
│   │   ├── test
│   │   │   └── README.md
│   │   ├── .DS_Store
│   │   ├── .env.nonprod
│   │   ├── .env.nonprod.example
│   │   ├── .env.prod
│   │   ├── .env.prod.example
│   │   ├── package-lock.json
│   │   ├── package.json
│   │   ├── README.md
│   │   └── tsconfig.json
│   └── .DS_Store
├── .DS_Store
├── .gitignore
├── CHANGELOG.md
├── package-lock.json
├── package.json
├── README_profiles_module.md
├── README.md
└── SITEMAP.md
├── node_modules/ (... many files omitted)
├── .git/ (... internal git data omitted)
├── .next/ (... build artifacts omitted)
```
