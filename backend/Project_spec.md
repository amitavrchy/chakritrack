# ChakriTrack — Backend Project Spec

> Stack: **NestJS 12 (ESM) + Prisma 7 + PostgreSQL 17 + Redis 7/BullMQ + S3/R2 + LLM gateway**
> Bangladesh job-application OS: application tracking, AI circular capture, deadline/exam reminders, encrypted document vault, prep tracker, community circular updates, bKash subscriptions.
> Master spec: `../PROJECT_SPEC.md` (product, phases, acceptance criteria). Build order: `../AGENTS.md §6`.

---

## 1. Overview & Goals

### Product
Job seekers (BCS/govt/bank/private) save circulars (link/photo/PDF/text), track each application through BD-specific stages, get reminders for apply/fee/exam/viva dates (push, local, email, SMS), store Teletalk-ready documents, prepare with syllabus-weighted MCQ + mock viva, and follow public circulars for verified admit-card/seat-plan/result updates.

### Engineering goals
- Reliable, deduplicated **reminder pipeline** (SKIP LOCKED scan + BullMQ jobId = dedupeKey).
- **Offline-first sync** API (clientId idempotency, version-based conflict resolution, tombstones).
- **AI extraction** with strict JSON schema, normalization of Bangla digits/dates/currency, per-field confidence, human confirm.
- **Encrypted vault** (envelope encryption, signed URLs, audit log).
- **Eligibility/age engine** as pure, shared, well-tested functions.
- Cost guardrails: per-user AI/SMS quotas, global budget kill-switch.

### Non-goals
- Job board / employer ATS; applying on users' behalf to Teletalk/BPSC.
- Scraping Bdjobs/LinkedIn or any site disallowing crawlers.
- Reading SMS inbox automatically.

---

## 2. User Roles & Permissions (RBAC)

| Role | Permissions |
|------|-------------|
| `USER` | Own applications, schedule, reminders, documents, resumes, prep, notes; follow circulars; report/vote updates; billing |
| `MODERATOR` | Review/publish circulars, verify/reject updates, review questions, moderate viva bank; no access to private user data/documents |
| `ADMIN` | Everything moderators can + users (suspend), plans/promo, feature flags, AI/SMS budgets, broadcasts, audit log viewer |
| `PUBLIC` (no auth) | Verified public circulars, tool endpoints (age calc), tokenized ICS feed, share links |

Rules: ownership enforced in services (`where: { id, userId }`); moderators/admins **cannot** read vault documents (no endpoint exists); every admin/moderator action → `AuditLog`.

---

## 3. Feature Modules (`src/<module>/`)

1. `config` — Zod-validated env, feature flags
2. `prisma` — PrismaService (adapter-pg) ✅ scaffolded
3. `health` — liveness/readiness ✅ scaffolded
4. `crypto` — AES-256-GCM field encryption, envelope keys for vault
5. `auth` — OTP, Google, JWT, sessions, guards, step-up
6. `users` — profile, educations, preferences, export/delete
7. `devices` — push tokens (Expo/FCM/Web Push)
8. `applications` — CRUD, kanban move, events, checklist, credentials reveal
9. `sync` — push/pull for mobile offline DB
10. `circulars` — catalog, organizations, follow, updates, votes, dedupe
11. `extraction` — capture pipeline (link/text/image/pdf/sms)
12. `ai` — provider gateway, prompts, quotas, usage metering, eval
13. `eligibility` — age & rule engine (pure functions)
14. `schedule` — schedule items, clash detection, ICS
15. `reminders` — ladder, scheduling, workers, drivers
16. `notifications` — in-app, digests, push/email/SMS drivers
17. `storage` / `documents` — presigned URLs, variants, share links, audit
18. `resumes` — CV JSON, score, tailor, PDF
19. `prep` — syllabus, plans, study sessions, questions, quizzes, FSRS
20. `viva` — mock viva sessions, interview notes
21. `engagement` — streaks, activity, badges, weekly report, referrals
22. `billing` — plans, bKash, subscriptions, entitlements
23. `admin` — moderation & ops endpoints
24. `analytics` — event forwarding, KPI rollups

---

## 4. Advanced Business Logic

### 4.1 Application stages
```
GOVT/BCS: SAVED → PREPARING → APPLIED → FEE_PAID → ADMIT_CARD → PRELIM → WRITTEN → PRACTICAL → VIVA → OFFER → JOINED
PRIVATE:  SAVED → APPLIED → INTERVIEW → OFFER → JOINED
Any non-terminal → REJECTED | WITHDRAWN | MISSED   (MISSED auto-set by job when deadline passed while stage ∈ {SAVED, PREPARING})
```
- Skipping stages allowed (user choice); backwards moves allowed but logged.
- `APPLIED` on a circular with `feeChannel=TELETALK_SMS` → create `FEE_DEADLINE` at appliedAt + 72h (config `FEE_WINDOW_HOURS`, override from circular).
- `FEE_PAID` cancels pending fee reminders.
- Entering `VIVA` creates checklist ("documents originals", "mock viva") + suggests mock viva.

### 4.2 Kanban ordering
Fractional indexing (base-62 keys between neighbours, e.g. `fractional-indexing` npm). `POST /applications/:id/move { stage, beforeId?, afterId? }` computes key server-side in a transaction; nightly `board.rebalance` when any key > 32 chars.

### 4.3 Reminder engine
See `../PROJECT_SPEC.md §5.1`. Implementation notes:
- `ReminderPlanner.plan(item, user, now)` is pure → returns desired reminders; `ReminderService.reconcile()` diffs with DB (upsert by `dedupeKey`, cancel extras) inside the same transaction as the ScheduleItem write.
- Scanner: `SELECT id FROM "Reminder" WHERE status='PENDING' AND "fireAt" <= now() + interval '30 seconds' ORDER BY "fireAt" LIMIT 500 FOR UPDATE SKIP LOCKED` → set `QUEUED` → `queue.add('send', {id}, { jobId: dedupeKey, delay })`.
- Sender: re-check item not deleted & reminder still QUEUED; respect daily push cap; driver send; `SENT`/`FAILED` + attempts; exponential backoff (1m, 5m, 15m).
- Quiet hours: shift non-critical into next 07:30 Asia/Dhaka.

### 4.4 Extraction pipeline
```
POST /extractions  → row QUEUED → queue extraction.run
run: load input → (LINK) fetch if allowed (robots check, 10s, 5MB, html→text / pdf→images) 
   → (IMAGE/PDF) vision model with CircularDraft JSON schema  | fallback tesseract ben+eng → text model
   → normalize: Bangla digits ০-৯→0-9, Bangla months (জানুয়ারি…ডিসেম্বর) → ISO, "৳/টাকা" → poisha, time "বিকাল ৫টা" → 17:00 Asia/Dhaka
   → validate (zod) + sanity rules (deadline ≥ publish, ≤ 120 days ahead, fee ≤ ৳5,000, ageMax 18–45)
   → confidence per field (model-reported × rule checks) → NEEDS_REVIEW (any field < 0.8) | DONE
   → dedupe contentHash → link canonical circular if public
POST /extractions/:id/confirm { draft (user-edited), createApplications: [{postIndex}] }
   → tx: upsert Circular(private or link), CircularPosts, Applications, ScheduleItems, Reminders; store user diff for eval
```
SMS paste parser: regex library `extraction/sms-patterns.ts`, each pattern with sample fixtures; unknown → return `{ matched: false }`.

### 4.5 Eligibility engine
`evaluate(rules, profile, referenceDate) → { status, reasons[], ageOn: {y,m,d}, ageOutDate? }` — pure TS, no Prisma imports, 100% branch coverage. Age = full years/months/days between DOB and reference date (inclusive conventions documented in tests; verify against official age calculators used in circulars).

### 4.6 Sync
`POST /sync/push { ops: [{ op: 'upsert'|'delete', entity, clientId, id?, baseVersion?, data }] }` → per-op result `{ clientId, id, version, status: 'applied'|'conflict_resolved'|'rejected', serverRow? }`. Max 200 ops/request. Entities: application, checklistItem, scheduleItem, interviewNote, studySession.
`GET /sync/pull?cursor=<base64(updatedAt|id)>&limit=500` → `{ changes: { applications: [...], ... }, nextCursor, hasMore }` including tombstones.
Conflict rule: scalar LWW by `updatedAt`; `stage` → max progress unless terminal newer; `notes` → merge with marker.

### 4.7 Documents & encryption
- Upload: `POST /documents/upload-url { kind, mime, sizeBytes, sha256 }` → presigned PUT (key `u/{userId}/{cuid}`), 5 min.
- Client encrypts? **No (MVP)** — server-side envelope: on finalize, worker reads object, encrypts with per-user DEK (DEK stored encrypted by KEK in `UserKey` table — add in M4), rewrites object, deletes plaintext. v2: client-side encryption option.
- Download: `GET /documents/:id/download-url` → short-lived URL to a decrypting stream endpoint (`/documents/:id/stream?sig=`), audit logged.
- Variants: verify dimension & size limits; regenerate with sharp if client output invalid.

### 4.8 Streaks, badges, referral
- `EngagementService.recordActivity(userId, action, amount)` upserts ActivityDay (Dhaka date) + optimistic streak; nightly rollover authoritative.
- Badge rules declarative (`badges.rules.ts`), evaluated on domain events (EventEmitter).
- Referral qualification on events `PHONE_VERIFIED` + `APPLICATION_CREATED` count ≥3; fraud checks: same device id / IP /24 within 24h → manual review.

### 4.9 Billing (bKash tokenized)
```
POST /billing/checkout { plan, interval } → create Payment(INITIATED, idempotencyKey) 
  → bKash grant token (cached ~1h; refresh) → create agreement (mode 0000) or URL payment (mode 0011) → return bkashURL
GET /billing/bkash/callback?paymentID&status → execute → query → if Completed: Payment SUCCEEDED, Subscription ACTIVE, User.plan/planExpiresAt
billing.renew (hourly): ACTIVE subs ending in <24h with agreementId → pay-with-agreement (mode 0001) → extend | PAST_DUE (3-day grace) → EXPIRED
```
All endpoints/field names per developer.bka.sh docs; base URL from onboarding (**verify**). Never grant entitlement from callback params alone — always query.

### 4.10 Edge cases
- Corrigendum/deadline extension on canonical circular → propagate to linked applications (unless user overrode the date) + notify.
- Duplicate capture of same circular → return existing application suggestion.
- User deletes account → revoke sessions, cancel bKash agreement, purge documents ≤30 days, anonymize community content.
- Clock skew from offline devices → server `updatedAt` authoritative; client timestamps only for ordering hints.
- Exam postponed → schedule item updated, reminders reconciled, "postponed" notification.
- Multiple posts same circular → separate applications sharing `circularId`.

---

## 5. State Machines

**Application**: see §4.1  
**Extraction**: `QUEUED → PROCESSING → NEEDS_REVIEW | DONE | FAILED`; `NEEDS_REVIEW|DONE → (confirm) linked`  
**Circular**: `DRAFT → PENDING_REVIEW → PUBLISHED → CLOSED → ARCHIVED`; `PENDING_REVIEW → REJECTED`  
**CircularUpdate**: `unverified → verified` (official domain | moderator | reputation+votes) or removed  
**Reminder**: `PENDING → QUEUED → SENT | FAILED`; `PENDING → CANCELLED | SKIPPED`  
**Subscription**: `TRIALING → ACTIVE → PAST_DUE → ACTIVE | EXPIRED`; `ACTIVE → CANCELLED (at period end) → EXPIRED`  
**Payment**: `INITIATED → PENDING → SUCCEEDED | FAILED | CANCELLED`; `SUCCEEDED → REFUNDED`  
**Referral**: `PENDING → QUALIFIED → REWARDED | REJECTED`

---

## 6. Prisma Schema

Source of truth: `prisma/schema.prisma` (validated at scaffold; 40+ models, enums for stages/kinds/channels). Key indexes:
- `Application(userId, stage, boardPosition)`, `(userId, deadlineAt)`, `(userId, updatedAt)` for sync pull.
- `Reminder(status, fireAt)` for scanner; `dedupeKey @unique`.
- `Circular(status, visibility, deadlineAt)`, `contentHash @unique`; add `pg_trgm` GIN index on `title` via raw SQL migration.
- `ReviewCard(userId, dueAt)` for daily review.
Raw-SQL additions planned: `CREATE EXTENSION pg_trgm;` partial index `Reminder WHERE status='PENDING'`.

---

## 7. REST API (prefix `/api/v1`)

Full list: `../PROJECT_SPEC.md §7`. Representative shapes:

```http
POST /auth/otp/request        { phone }                              → 204
POST /auth/otp/verify         { phone, code, deviceId? }             → { accessToken, refreshToken, user, isNew }
POST /auth/refresh            { refreshToken }                        → { accessToken, refreshToken }

GET  /applications?stage=&sector=&q=&deadlineBefore=&cursor=&limit=  → { items: Application[], nextCursor }
POST /applications            { title, organizationName, sector, stage?, deadlineAt?, circularId?, clientId? } → Application
POST /applications/:id/move   { stage, beforeId?, afterId? }          → { id, stage, boardPosition, version }
POST /applications/:id/reveal-credentials  (requires step-up token)  → { portalUserId, portalPassword }

POST /extractions             multipart(file) | { url } | { text } ; header Idempotency-Key → { id, status }
GET  /extractions/:id                                                 → { status, result: CircularDraft, confidence, rawTextSnippetMap }
POST /extractions/:id/confirm { draft, postIndexes: number[] }        → { circularId, applicationIds[], scheduleItemIds[] }

GET  /schedule/today                                                  → { items: ScheduleItem[], streak, nudges[] }
GET  /calendar/:token.ics                                             → text/calendar

POST /documents/upload-url    { kind, mime, sizeBytes, sha256 }       → { uploadUrl, storageKey, expiresAt }
POST /documents               { storageKey, kind, title, presets?[] } → Document
GET  /documents/:id/download-url                                      → { url, expiresAt }

POST /sync/push               { ops[] }                               → { results[] }
GET  /sync/pull?cursor=                                               → { changes, nextCursor, hasMore }

POST /billing/checkout        { plan, interval }                      → { bkashURL, paymentId }
```
Errors: `{ "error": { "code": "QUOTA_EXCEEDED", "message": "...", "details": {} } }`. Pagination: cursor. Rate limits: auth 20/min/IP, OTP 5/day/phone, extraction 10/min/user, global 180/min/user.

---

## 8. Real-time
MVP: none required (push + pull). v2: SSE `GET /events/stream` for extraction status & circular updates on web (fallback polling 3 s).

---

## 9. Jobs
See `../PROJECT_SPEC.md §8` (reminders.scan/send, extraction.run, circular.fanout, circular.deadline-sync, digest.daily/weekly, streak.rollover, billing.renew, documents.variants/purge, ai.eval, board.rebalance, analytics.rollup). Single-instance crons guarded by Redis lock. Worker can run in-process (`RUN_WORKER=true`) or as a separate container.

**Quotas (defaults, env-tunable):** Free — 30 active applications, 10 AI captures/mo, 3 CV scores/mo, 1 mock viva/mo, 100 MB. Pro — unlimited applications, 100 captures, 30 scores/tailors, 20 vivas, 2 GB, 30 SMS/mo.

---

## 10. Security
- OTP hashed (argon2/sha256+pepper), throttled; refresh rotation + reuse detection; JWT 15 min.
- Field encryption AES-256-GCM, format `v1:<keyId>:<iv>:<tag>:<ciphertext>` (base64url); key rotation by keyId.
- Vault envelope encryption, signed URLs ≤5 min, AuditLog on view/download/share/reveal.
- Helmet, CORS allow-list, request size limits (JSON 1 MB; uploads via presigned only), Zod validation.
- Webhook/callback verification by server-side query (bKash).
- PII minimization in logs (pino redact: phone, email, tokens, portal*), in AI prompts (strip NID/phone).
- PDPA 2026 compliance: consent records, export (`GET /me/export` zip), deletion pipeline.

---

## 11. Caching
- Public circular list/detail: Redis 60 s + HTTP `s-maxage` for Next ISR.
- bKash grant token cached until expiry − 5 min.
- Quota counters in Redis (`INCR` with month TTL), durable in `AiUsage`.
- Syllabus templates/badges in-memory, invalidated on admin change.

---

## 12. Testing
- Reminder planner: ladder, quiet hours, past offsets, deadline change reconcile, no duplicates under concurrent scans (2 workers).
- Eligibility/age: leap-year DOB, reference-date birthday, relaxations, missing data.
- Fractional index: 10k random moves keep strict order.
- Sync: replay same push 3× idempotent; conflict rules (stage progress, notes merge, tombstones).
- Extraction normalizers: Bangla digits/months/time/currency fixtures; golden-set eval ≥90%.
- Documents: preset validation; download writes AuditLog; non-owner 404.
- Billing: callback replay idempotent; failed query doesn't grant plan; renewal → PAST_DUE → EXPIRED.
- Streak rollover at Dhaka midnight boundaries; freeze consumption.

---

## 13. Folder Structure
```
backend/
  prisma/{schema.prisma, seed.ts, migrations/}
  prisma.config.ts
  src/
    main.ts  app.module.ts
    prisma/  health/  config/  crypto/  auth/  users/  devices/
    applications/  sync/  circulars/  extraction/  ai/{prompts/, providers/}
    eligibility/  schedule/  reminders/{drivers/}  notifications/
    storage/  documents/  resumes/  prep/  viva/  engagement/  billing/{bkash/}
    admin/  analytics/  common/{guards, decorators, filters, utils}
    generated/prisma/   (gitignored)
  test/{e2e, fixtures/circulars}
```

---

## 14. Env vars
See `.env.example`: `DATABASE_URL`, `REDIS_URL`, `RUN_WORKER`, `JWT_*`, `GOOGLE_OAUTH_CLIENT_IDS`, `OTP_*`, `VAULT_KEK_BASE64`, `FIELD_ENCRYPTION_KEY_BASE64`, `S3_*`, `AI_*`, `OCR_FALLBACK`, `PUSH_DRIVER`, `EXPO_ACCESS_TOKEN`, `FCM_*`, `WEB_PUSH_*`, `EMAIL_*`, `SMTP_URL`, `SMS_*`, `BKASH_*`, `FREE_*` limits, `DEFAULT_REMINDER_OFFSETS_MIN`, `SENTRY_DSN`, `POSTHOG_KEY`.

---

## 15. Milestones
1. Foundation, auth, profile (M1)
2. Applications, kanban, sync (M2)
3. Schedule, reminders, push, streak v1 (M3)
4. Storage/vault, AI gateway, extraction, eligibility (M4 → beta)
5. Prep, quizzes, FSRS, badges, weekly report (M5)
6. Resumes, ATS score, mock viva (M6)
7. Billing, public circulars, follow/updates, referral (M7)
8. Seat plan/result lookup, Gmail connector, partner APIs (M8)

---

## 16. Acceptance Criteria
- [ ] No duplicate reminder sends with 2 concurrent workers over 10k reminders.
- [ ] Deadline change reschedules all pending reminders in the same transaction.
- [ ] Offline push replay is idempotent; conflict rules covered by tests.
- [ ] Extraction golden set ≥90% field accuracy (deadline, fee, age, org, posts).
- [ ] Vault documents never publicly reachable; every download audited.
- [ ] Encrypted fields never appear in logs or list responses.
- [ ] bKash payments granted only after server-side query success; callbacks idempotent.
- [ ] Streak rollover correct across Asia/Dhaka midnight.
- [ ] Seed: BCS syllabus template, badges, BPSC/Bangladesh Bank organizations.

---

## 17. Agent Notes
- Bangla-first: store `titleBn` alongside `title`; normalizers must handle Bangla digits everywhere.
- Asia/Dhaka for all day logic; money ints (poisha).
- BD govt flows: Teletalk fee window, admit card, seat plan, viva — model them as ScheduleItems, never hard-code dates.
- Respect data-source policy (`../PROJECT_SPEC.md §11`). Mark unknowns `verify` instead of guessing.
