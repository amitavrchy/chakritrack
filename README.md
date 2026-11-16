# ChakriTrack (চাকরিট্র্যাক)

**Job-application OS for Bangladeshi graduates** — track every BCS / bank / govt / private application, circular deadline, Teletalk fee window, exam, viva and document in one Bangla-first app (Android + web).

> Not a job board. Find circulars on Teletalk/BPSC/Bdjobs — manage your whole chakri journey in ChakriTrack.

## Structure
| Path | What | Stack |
|---|---|---|
| `backend/` | REST API, workers, AI gateway | NestJS 12, Prisma 7, PostgreSQL 17, Redis/BullMQ |
| `frontend/` | Web app, admin, SEO/tool pages | Next.js 16 (App Router), React 19, Tailwind 4 |
| `apps/mobile/` | Android-first mobile app (offline-first) | Expo SDK 58, React Native 0.88 |
| `docs/research/` | Market & technical research with sources | — |

## Specs
- [`PROJECT_SPEC.md`](./PROJECT_SPEC.md) — vision, personas, phases (MVP/v2/v3), feature modules + acceptance criteria, business logic, data model, API, jobs, notifications, security, KPIs, monetization.
- [`AGENTS.md`](./AGENTS.md) — how to build: stack, commands, rules, testing, milestone checklists.
- [`backend/Project_spec.md`](./backend/Project_spec.md) — backend detail.
- [`frontend/AGENTS.md`](./frontend/AGENTS.md), [`apps/mobile/AGENTS.md`](./apps/mobile/AGENTS.md).

## Quick start
```bash
# API
cd backend && cp .env.example .env && docker compose up -d && npm install && npm run db:migrate:dev && npm run start:dev
# Web
cd frontend && cp .env.example .env.local && npm install && npm run dev
# Mobile
cd apps/mobile && cp .env.example .env && npm install && npx expo start
```
Ports: API 4000 · Web 3000 · Postgres 5545 · Redis 6389 · MinIO 9010/9011 (chosen not to clash with other local projects).

## Status
M0 scaffold complete (Nov 2026). Next: M1 auth & onboarding — see `AGENTS.md §6`.
