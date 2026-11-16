# AGENTS.md — ChakriTrack (read me first)

Instructions for AI coding agents (Cursor, Claude Code, Codex, etc.) and humans. **Read `PROJECT_SPEC.md` for *what* to build; this file is *how*.**
Banglish note: ek ek milestone kore build koro, protita milestone er checklist sesh na hole porer ta shuru korbe na.

## 1. Repo layout
```
chakritrack/
├── PROJECT_SPEC.md          # master product/engineering spec (source of truth)
├── AGENTS.md                # this file
├── README.md
├── docs/research/           # sources & competitor notes (cite these, never invent facts)
├── backend/                 # NestJS 12 + Prisma 7 + PostgreSQL 17 + Redis/BullMQ  (port 4000, prefix /api/v1)
│   ├── Project_spec.md      # backend detail: RBAC, modules, logic, API shapes, jobs
│   ├── AGENTS.md            # NestJS-version notes (generator) + backend rules
│   ├── prisma/schema.prisma # data model (source of truth for DB)
│   └── src/
├── frontend/                # Next.js 16 App Router + TS + Tailwind 4 (port 3000) — web app, admin, SEO pages
│   └── AGENTS.md
└── apps/
    └── mobile/              # Expo SDK 58 + React Native 0.88 + TS — Android-first app
        └── AGENTS.md
```
No monorepo tool yet: each package has its own `package.json`/lockfile and uses **npm** (pnpm not installed). Shared code (API types, rules engine) → introduce `packages/shared` with npm workspaces only at M2 if duplication hurts; until then generate API types from OpenAPI.

## 2. Tech stack (pinned at scaffold time, Nov 2026)
| Layer | Choice | Notes |
|---|---|---|
| API | NestJS 12 (ESM), Node 22 | Relative imports end in `.js`; tests on Vitest; validation with Zod via Standard Schema pipe |
| DB | PostgreSQL 17, Prisma 7.10 (`prisma-client` generator → `src/generated/prisma`, `@prisma/adapter-pg`) | `prisma.config.ts` holds datasource URL; **don't** upgrade to Prisma 8 RC |
| Queue/cache | Redis 7 + BullMQ (`@nestjs/bullmq`), `@nestjs/schedule` for cron triggers | |
| Storage | S3-compatible (Cloudflare R2 prod, MinIO local) | private bucket, presigned URLs |
| Web | Next.js 16.4 App Router, React 19.3, Tailwind 4, TanStack Query, next-intl (bn/en), shadcn/ui-style components | read `node_modules/next/dist/docs` before using Next APIs |
| Mobile | Expo SDK 58, RN 0.88, expo-router, expo-sqlite (offline DB), expo-notifications, expo-secure-store, expo-image-manipulator, expo-local-authentication, expo-background-task | install with `npx expo install` |
| AI | Provider-agnostic gateway in backend (`AiModule`), JSON-schema structured output, mock provider for tests | model ids from env — never hard-code |
| Payments | bKash Tokenized Checkout (sandbox first) | |
| Observability | Sentry, PostHog (consent), pino logs | |

## 3. Commands
```bash
# backend
cd backend
cp .env.example .env
docker compose up -d            # postgres:5545, redis:6389, minio:9010/9011
npm install                     # runs prisma generate (postinstall)
npm run db:migrate:dev          # create/apply migrations
npm run db:seed
npm run start:dev               # http://localhost:4000/api/v1/health
npm run build && npm run typecheck && npm test && npm run test:e2e && npm run lint
npx prisma validate

# frontend
cd frontend && cp .env.example .env.local && npm install && npm run dev
npm run build && npm run lint

# mobile
cd apps/mobile && cp .env.example .env && npm install && npx expo start
npx tsc --noEmit && npx expo-doctor
```

## 4. Coding rules
1. **TypeScript strict everywhere.** No `any` without a comment explaining why.
2. **Money** = integer poisha (`*Minor`). **Time** = UTC in DB; display & day boundaries in `Asia/Dhaka` (use `date-fns-tz` or `Temporal` polyfill). Never `new Date()` math across days without TZ.
3. **i18n:** every user-facing string through i18n keys (`bn` default, `en`). Support Bangla digits display toggle. Fonts: Noto Sans Bengali / Hind Siliguri (web: `next/font`, mobile: `expo-font`).
4. **Validation:** Zod schemas per endpoint (backend) shared shape with clients via generated OpenAPI types.
5. **Auth on every route** unless decorated `@Public()`. Ownership checks in services (`where: { id, userId }`), never trust client userId.
6. **Idempotency:** client-created entities carry `clientId`; money/AI POSTs require `Idempotency-Key`.
7. **Encrypted fields** (`/// @encrypted` in schema) only via `CryptoService.encrypt/decrypt`; never log them; never return them except via the explicit reveal endpoint.
8. **AI calls** only through `AiService` (quota check → provider → schema validate → log `AiUsage`). Prompts live in `backend/src/ai/prompts/*.ts` with a `version` constant.
9. **No scraping** of Bdjobs/LinkedIn or any site whose robots/ToS forbid it (PROJECT_SPEC §11). Link fetch only on explicit user action with a polite UA, timeout 10 s, size cap 5 MB.
10. **Errors:** throw Nest HTTP exceptions with `{ code, message }`; codes are SCREAMING_SNAKE (`APPLICATION_NOT_FOUND`, `QUOTA_EXCEEDED`).
11. **Migrations:** one migration per PR, named meaningfully; never edit applied migrations; raw SQL (pg_trgm, partial indexes) goes in migration files.
12. Keep files < 300 lines; feature-module folders: `src/<feature>/{<feature>.module.ts, .controller.ts, .service.ts, dto/, <feature>.spec.ts}`.
13. Conventional commits (`feat(applications): kanban move endpoint`).
14. Don't remove the generator-maintained blocks in `frontend/AGENTS.md` and `apps/mobile/AGENTS.md`.

## 5. Testing
- Backend: Vitest unit tests for pure logic (reminder ladder, eligibility, age calc, streak, FSRS, fractional index, dedupe hash, SMS parser); e2e with supertest against a real Postgres (docker) using a disposable schema; AI tests use the `mock` provider + recorded fixtures.
- Golden set: `backend/test/fixtures/circulars/*.{jpg,pdf,txt}` + expected JSON; `npm run eval:extraction` reports per-field accuracy (target ≥90%).
- Web: Playwright smoke (login, create application, drag card, upload doc) — add at M2.
- Mobile: Jest + React Native Testing Library for components; Maestro flows for critical paths (capture → reminder) at M4.
- CI (GitHub Actions, add at M1): backend build/typecheck/test/prisma validate, frontend build/lint, mobile tsc/expo-doctor.

## 6. Build order (milestones & checklists)

### M0 — Scaffold ✅ (done)
- [x] Next.js, NestJS+Prisma, Expo scaffolds; schema.prisma validates; health endpoint; specs & research docs.

### M1 — Foundation & auth (week 1–2)
- [ ] Backend: ConfigModule validation (Zod env schema), pino logger, global exception filter, Standard Schema validation pipe, throttler, helmet, OpenAPI (`/api/docs` dev only).
- [ ] First migration from schema; seed runs.
- [ ] `CryptoService` (AES-256-GCM, key rotation id prefix), `AuthModule`: OTP request/verify (SMS driver console in dev), Google sign-in, JWT access + rotating refresh (Session family), `@Public()`, `@CurrentUser()`, roles guard.
- [ ] `/me` profile + educations + onboarding fields.
- [ ] Web: app shell, i18n (bn/en), auth pages, onboarding wizard, TanStack Query client with refresh handling (HttpOnly cookie via Next route handler proxy).
- [ ] Mobile: convert to expo-router (`src/app`), tabs (Today, Board, Calendar, Vault, More), auth flow, secure token storage, i18n.
- [ ] CI workflow.
- **Done when:** a user can sign up by phone OTP on web & mobile, complete onboarding, see empty Today screen; tests green.

### M2 — Applications, kanban & offline sync (week 2–4)
- [ ] `ApplicationsModule` CRUD, move (fractional index util + tests), events, checklist templates per sector, bulk ops, filters/search.
- [ ] Encrypted portal credentials + step-up reveal.
- [ ] `SyncModule` push/pull with clientId idempotency + conflict rules (PROJECT_SPEC §5.2).
- [ ] Web: board (dnd-kit), list view, detail drawer, checklist, timeline.
- [ ] Mobile: SQLite schema + repository layer, outbox, sync on foreground/connectivity, board (horizontal columns), detail screen.
- **Done when:** airplane-mode edits on phone sync correctly; drag & drop persists; e2e tests for move + sync.

### M3 — Schedule, calendar, reminders, push (week 4–6)
- [ ] `ScheduleModule` + auto items from application deadlines/fee windows; clash detection; ICS feed.
- [ ] `RemindersModule`: ladder generation, quiet hours, BullMQ scan/send, drivers (console/expo/fcm/email/sms), dedupe.
- [ ] `NotificationsModule` in-app list; daily digest job.
- [ ] Devices registration; Expo push tokens; Web Push (VAPID) on web.
- [ ] Mobile local notification scheduler (next 30 days, ≤60 scheduled) synced with server.
- [ ] Streak v1 (ActivityDay + nightly rollover).
- **Done when:** changing a deadline reschedules reminders; a reminder fires offline on device; no duplicates in a 1,000-reminder load test.

### M4 — AI circular capture + document vault (week 6–9) → **MVP beta**
- [ ] `StorageModule` (presigned PUT/GET), `DocumentsModule` with envelope encryption, variants, audit log, share links.
- [ ] Teletalk presets on mobile (expo-image-manipulator) & web (canvas) + server verification; free public web tool `/tools/photo-resizer`.
- [ ] `AiModule` gateway (gemini/openai-compatible/mock), quotas, budget guard.
- [ ] `ExtractionModule`: link/text/image/PDF → CircularDraft JSON schema → normalization (Bangla digits/dates/৳) → confidence → review → confirm (creates application + schedule + reminders); dedupe hash; SMS paste parser.
- [ ] Eligibility & age engine + age-out countdown.
- [ ] Golden-set eval script.
- [ ] Web public pages: landing, `/tools/age-calculator`, privacy policy, terms.
- **Done when:** capture flow < 30 s on a real circular photo; ≥90% field accuracy on golden set; vault presets pass property tests. Release closed beta (EAS build internal track).

### M5 — Prep tracker + engagement (week 9–12)
- [ ] Syllabus templates, prep plans, study timer/log, heatmap stats.
- [ ] Question bank (admin import CSV, review flag), quiz attempts, negative marking, FSRS review cards.
- [ ] Badges, streak freezes, weekly report + share card (OG image route on web).
- **Done when:** a BCS user can run a 200-mark mock and get subject-wise analytics; streak/freeze edge tests pass.

### M6 — CV studio + mock viva + interview notes AI (week 12–15)
- [ ] Resume JSON editor, templates (bn/en), PDF export, deterministic ATS score + LLM suggestions, grounded tailoring validator.
- [ ] Mock viva sessions (text), rubric feedback; anonymized viva bank (opt-in, moderated).

### M7 — Billing + follow-a-circular + public launch (week 15–18)
- [ ] bKash sandbox: agreement create/execute/query/cancel, pay-with-agreement, URL checkout, callbacks, renewal job, plan limits enforcement.
- [ ] Public circular catalog, follow, community updates with official-domain auto-verification, voting, fan-out job, moderation admin.
- [ ] Referral rewards, SEO circular pages (ISR), sitemap.
- [ ] Security review (OWASP ASVS L2 checklist), privacy policy aligned with PDPA 2026, Play Store listing (Data safety form).

### M8 — Network effects (v3)
- [ ] Seat-plan/result PDF roll lookup, study groups, Gmail connector (restricted scope review), browser extension, partner dashboards.

## 7. Definition of done (every PR)
- Builds, typechecks, lints, tests pass in all touched packages.
- New endpoints documented in OpenAPI + `backend/Project_spec.md §7` if shape changed.
- Strings localized (bn + en).
- No secrets, no PII in logs, no new scraping.
- Updated checklist above.
