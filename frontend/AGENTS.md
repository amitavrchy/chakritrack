# AGENTS.md — ChakriTrack web (`frontend/`)

Read `../PROJECT_SPEC.md` (what) and `../AGENTS.md` (how, milestones) first. This file covers web specifics.

## Stack
Next.js 16.4 App Router · React 19.3 · TypeScript strict · Tailwind CSS 4 · TanStack Query v5 · next-intl (bn default, en) · dnd-kit (kanban) · react-hook-form + Zod · date-fns-tz (Asia/Dhaka) · Playwright (e2e). Install libraries with `npm install`; check their docs for versions compatible with React 19 / Next 16.

## Scope of the web app
1. **Public (SEO, static/ISR):** landing `/`, `/circulars` + `/circulars/[slug]` (verified public circulars: countdown, fee, age-limit check, "Track this"), `/tools/photo-resizer` (Teletalk photo 300×300 ≤100KB / signature 300×80 ≤60KB, 100% client-side canvas — no upload), `/tools/age-calculator`, `/pricing`, `/privacy`, `/terms`, `/c/[id]` share-card landing, dynamic OG images (`opengraph-image.tsx`) for share cards.
2. **App (`/app/*`, authenticated):** Today, Board (kanban), List, Calendar (month/agenda + ICS link), Application drawer (checklist, timeline, documents, notes, eligibility), Capture (paste link/text, upload image/PDF → review screen with low-confidence highlights & source snippets), Vault, CV studio (v2), Prep (v2), Settings (profile, education, reminders, quiet hours, devices, plan/billing, data export/delete).
3. **Admin (`/admin/*`, role-gated):** circular review/publish, update verification, question review, AI/SMS cost, broadcasts.

## Structure
```
src/
  app/
    (marketing)/  page.tsx, circulars/, tools/, pricing/, privacy/, terms/
    (app)/app/    layout.tsx (auth guard), today/, board/, list/, calendar/, applications/[id]/, capture/, vault/, cv/, prep/, settings/
    (admin)/admin/
    api/auth/[...]/route.ts   # BFF: stores refresh token in HttpOnly cookie, proxies refresh
  components/   ui/ (primitives), board/, calendar/, capture/, vault/
  lib/          api-client.ts (fetch wrapper + generated OpenAPI types), query-client.ts, i18n/, dates.ts (Dhaka), money.ts (poisha↔৳), bangla-digits.ts
  messages/     bn.json, en.json
```

## Rules
- Server Components by default; `"use client"` only for interactive parts (board, capture, timers).
- Auth: access token in memory, refresh token in HttpOnly SameSite=Lax cookie via route handler; never localStorage.
- All strings via next-intl; default locale `bn`; Bangla font via `next/font` (Noto Sans Bengali / Hind Siliguri) + Latin font.
- Dates: format with Asia/Dhaka; offer Bangla numerals toggle.
- Money: display `৳1,250` from poisha ints.
- Accessibility: keyboard DnD for board (dnd-kit sensors), focus rings, color-contrast AA; Bangla line-height ≥1.6.
- Performance: marketing pages static/ISR, LCP < 2 s; no heavy client libs on public pages; images via `next/image`.
- Photo resizer tool must run entirely in the browser (privacy + zero server cost) and validate final bytes ≤ limit (iterative JPEG quality search).
- Web Push: service worker + VAPID key (`NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC`), opt-in prompt only after the user creates a deadline.

## Commands
`npm run dev` · `npm run build` · `npm run lint` · (M2+) `npx playwright test`

## Done checklist (web, per milestone — see ../AGENTS.md §6)
- [ ] M1 shell, i18n, auth, onboarding
- [ ] M2 board/list/drawer
- [ ] M3 calendar, today, notifications, web push
- [ ] M4 capture review UI, vault, photo-resizer & age tools, legal pages
- [ ] M5 prep & share cards · M6 CV studio · M7 pricing/billing, public circulars, admin moderation

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
