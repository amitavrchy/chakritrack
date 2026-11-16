# ChakriTrack — Master Product & Engineering Spec

> **One-liner:** The job-application OS for Bangladeshi graduates — every circular, deadline, fee, exam, viva, document and prep session in one Bangla-first app.
> **Not** a job board. We don't compete with Bdjobs/Teletalk on listings; we organize the user's *own* job hunt around them.
>
> Stack: **Next.js 16 (web) · Expo SDK 58 / React Native 0.88 (Android-first app) · NestJS 12 + Prisma 7 + PostgreSQL 17 · Redis 7 + BullMQ · S3/R2 · LLM gateway**
> Status: v0.1 scaffold (Nov 2026). Companion docs: `AGENTS.md` (how to build), `backend/Project_spec.md` (API/backend detail), `frontend/AGENTS.md`, `apps/mobile/AGENTS.md`, `docs/research/*` (sources).
>
> Banglish note: ei file ta "source of truth". Kono feature build korar age ekhane acceptance criteria dekhe nao.

---

## 0. Why now (evidence)

| Signal | Data | Source |
|---|---|---|
| Graduate unemployment | 13.54% in 2024 (highest of any education level), ~8.85 lakh unemployed graduates | BBS LFS 2024 via The Daily Star / TBS (docs/research/sources.md #1–2) |
| Long search cycles | 1 in 3 unemployed graduates jobless up to 2 years; BCS takes 3–5 years prelim→recommendation | Daily Star (#3), Prothom Alo (#5) |
| Supply ≫ demand | ~7 lakh graduates/yr vs ~3 lakh formal jobs | Prothom Alo / Daily Star (#4–5) |
| Fragmented process | Govt circulars spread over Teletalk Alljobs, BPSC, Bangladesh Bank e-recruitment, national portal, district sites; fee by Teletalk SMS within ~72h; admit card / seat plan / result on separate portals | bdgovernmentjobs.com official-links list, BPSC circulars (#6–9) |
| Global category proven | Huntr, Teal, Simplify charge US$13–40/mo for trackers + AI — none support BD govt workflows, Bangla, Teletalk fees, BCS stages | Simplify/Offboard/ApplyKoala comparisons (#10–12) |

**Wedge:** a BCS/bank/govt aspirant applies to 20–80 circulars a year, each with its own deadline, fee window, admit card date, exam, seat plan, viva and result. Today they track this in notebooks, screenshots and Facebook groups. Missing one fee deadline = losing the application. That pain makes *daily/weekly* usage natural.

---

## 1. Vision, goals, non-goals

### 1.1 Vision
"Ekta app e amar puro chakri jatra" — from saving a circular to joining letter, nothing is missed, and the user always knows what to do *today*.

### 1.2 Product goals (12 months)
- **G1** 10–15k weekly active users (WAU) with ≥35% W4 retention among activated users.
- **G2** Zero missed deadlines for active users (measured: reminders delivered ≥99% before deadline).
- **G3** Circular capture in <30 s (photo/link → saved application with deadline + reminders).
- **G4** Infra cost < ৳15,000/month at 15k WAU; AI cost capped by quotas.
- **G5** Break-even via Pro subscriptions (bKash) at ~2–3% paid conversion.

### 1.3 Engineering goals
- Offline-first mobile (SQLite + sync); reminders fire even without internet (local notifications).
- Idempotent, deduplicated reminder pipeline (exactly-once *perceived* delivery).
- Strong privacy for documents (NID, certificates): envelope encryption, signed URLs, audit log.
- AI features behind a provider-agnostic gateway with schema-validated outputs, per-user quotas and a global budget kill-switch.
- Bangla-first i18n (bn default, en toggle), Bangla numerals optional, Asia/Dhaka everywhere.

### 1.4 Non-goals (explicitly out)
- Hosting job listings as a job board / employer ATS (maybe v3 partner feed, never scraped).
- Submitting applications *on behalf of* users to Teletalk/BPSC (legal/ToS + CAPTCHA; we deep-link only).
- Auto-reading SMS inbox on Android (Google Play restricts READ_SMS to default-SMS apps — use paste/share instead; verify current policy).
- Scraping LinkedIn or Bdjobs (see §11 legal). Users may *paste a link* they opened; we only fetch with user action and respect robots/ToS.
- Coaching-center style video courses.

---

## 2. Personas

| Persona | Profile | Jobs-to-be-done | Key features |
|---|---|---|---|
| **Rafi — BCS/govt aspirant** (primary) | 24, Masters from public university, Dhaka mess, Android ৳15–25k phone, applies to 40+ govt circulars/yr | Never miss a deadline/fee; know exam & viva dates; track BCS stages; prep daily | Circular capture, fee timer, exam calendar, seat-plan alert, prep tracker, streaks |
| **Nusrat — bank & private job seeker** | 23, BBA private university, applies to banks (Bangladesh Bank, combined bank exam) + private (Bdjobs, LinkedIn) | Kanban of 30–60 applications; CV tailored per job; interview notes | Kanban, CV studio/ATS score, interview notes, contacts |
| **Tanvir — fresh grad, district town** | 22, National University, Rajshahi, low data, shared phone | Find what he's eligible for; cheap; Bangla only | Eligibility/age engine, Bangla UI, SMS fallback, light APK, offline |
| **Mentor/coaching admin** (v3) | Runs a BCS FB group / coaching batch | Share verified circular updates to students | Public circular pages, verified updates, group links |

---

## 3. Phases & scope

### MVP (M0–M4, ~8–10 weeks solo/AI-assisted) — "never miss a deadline"
1. Auth (phone OTP + Google), onboarding (DOB, education, sectors, tracks, district).
2. Applications: CRUD, kanban + list, stages tailored for BD (govt/BCS ladder + private ladder), priority, notes, checklist, timeline.
3. AI Circular Capture v1: paste link / text / photo / PDF → draft → user confirms → application + schedule items + reminders.
4. Schedule & calendar: deadlines, fee deadlines, exams, viva; agenda "Today" view; ICS export.
5. Reminders: push (Expo/FCM) + local notifications offline + email; default ladder T-7d/T-3d/T-1d/T-3h; quiet hours.
6. Document vault v1: upload, Teletalk photo/signature presets (resize/compress client-side), encrypted storage.
7. Eligibility & age-limit engine v1 (age on circular reference date + "age-out countdown").
8. Streak + "Today" checklist; weekly digest email/push.
9. Web app parity for tracker/calendar/vault; public landing + SEO pages for circular deadlines (programmatic, from *verified* public circular data only).

### v2 (months 3–6) — "prep + community + money"
- Prep tracker: syllabus templates (BCS prelim 200 marks, bank, primary), study timer, subject heatmap, MCQ practice with FSRS spaced repetition, full mock with negative marking.
- AI mock viva (text first, Bangla voice later), viva question bank from opt-in anonymous interview notes.
- CV studio: structured resume, ATS keyword score vs circular/JD, AI tailoring suggestions, Bangla/English PDF.
- Follow-a-circular: crowd-reported + moderator/official-link verified updates (admit card, seat plan, exam date change, result) → push to all followers.
- Pro plan via bKash tokenized checkout (agreement + recurring) — verify merchant onboarding.
- SMS fallback for critical reminders (Pro / opt-in), referral rewards, share cards.

### v3 (6–12 months) — "network effects"
- Seat-plan lookup (user enters roll → we parse the official seat-plan PDF they or a moderator uploaded).
- Result alerts with roll matching from official result PDFs (moderator-uploaded, official URL required).
- Study groups / accountability partners; leaderboards by exam track.
- Gmail connector (OAuth, read-only, user-approved) for private-job status suggestions (pattern of Simplify) — Google restricted-scope verification needed (verify cost/time).
- Partnerships: coaching centers, university career clubs; B2B dashboards (anonymized, aggregate only).
- Chrome/Edge extension "Save to ChakriTrack" for Bdjobs/LinkedIn pages the user is viewing (user-initiated capture of the visible page only).

---

## 4. Feature modules (with acceptance criteria)

Each module lists: **What**, **Rules/logic**, **Acceptance criteria (AC)**. Phase tag in brackets.

### 4.1 Auth & onboarding [MVP]
- Phone OTP (BD numbers `+8801[3-9]XXXXXXXX`), email+password optional, Google sign-in (web + Android).
- Onboarding (≤60 s, skippable after step 1): name, DOB, highest education (+subject, result), target sectors, exam tracks, home district, language.
- Refresh-token rotation with family revocation; device list with "log out everywhere".
- **AC:** OTP expires in 5 min, max 5 attempts, resend cooldown 60 s, 5 OTP sends/phone/day; reused refresh token revokes the family; onboarding data visible in profile and editable; DOB required before eligibility features unlock (prompted, not forced at signup).

### 4.2 Applications & kanban [MVP]
- Fields: title/post, organization, sector, stage, priority (incl. DREAM), deadline, applied date, fee + paid date, portal user ID/password (encrypted, masked, reveal requires biometric/PIN), roll number, URL, location, salary, tags, color, notes.
- **Stage ladders** (user can hide unused columns):
  - Govt/BCS: `SAVED → PREPARING → APPLIED → FEE_PAID → ADMIT_CARD → PRELIM → WRITTEN → PRACTICAL → VIVA → OFFER → JOINED`
  - Private: `SAVED → APPLIED → INTERVIEW → OFFER → JOINED`
  - Terminal: `REJECTED | WITHDRAWN | MISSED`
- Drag & drop with fractional indexing (`boardPosition`); bulk actions; filters (sector, stage, deadline window, tag); search.
- Per-application checklist auto-generated from sector template (e.g. govt: "Photo 300×300 ≤100KB ready", "Signature ready", "Pay fee via Teletalk within 72h", "Download admit card", "Print applicant copy").
- Timeline (`ApplicationEvent`) for every stage change/fee/doc attach.
- **AC:** moving a card writes exactly one event; reordering 1,000 cards never requires renumbering more than the moved card (rebalance job only when key length > 32); `APPLIED` without `FEE_PAID` for govt circulars with a fee shows a red "Fee pending — X h left" badge; offline edits sync without duplicates (clientId idempotency).

### 4.3 AI Circular Capture [MVP → v2]
- Inputs: link (user-pasted), photo (camera/gallery; multi-page), PDF, plain text, forwarded/pasted Teletalk SMS.
- Pipeline: upload → (link: fetch HTML/PDF if allowed by robots & public, else ask for screenshot) → OCR/vision LLM → **strict JSON schema** (`CircularDraft`) → validation & normalization (Bangla digits → ASCII, Bangla dates → ISO, ৳ amounts → poisha) → per-field confidence → user review screen (low-confidence fields highlighted) → save.
- `CircularDraft` = { organization, titleBn/En, sector, posts[{name, vacancies, grade, payScale, eligibility}], applyStartAt, deadlineAt, feeMinor per post/grade, feeChannel, ageMin/ageMax, ageReferenceDate, quotaRelaxations[], districts[], requirements, applyUrl, examInfo?, sourceUrl }.
- **Dedupe to canonical circular:** normalized `contentHash` (org + deadline + sorted post names). If a PUBLIC canonical circular exists, link to it instead of creating a duplicate (enables follow/updates). User-only data stays private until a moderator publishes.
- SMS parser (regex, no AI): Teletalk payment confirmation patterns → extract User ID / password / transaction → attach to matching application (stored encrypted). *Patterns must be built from real user-supplied samples; mark unknown formats `verify`.*
- **AC:** ≥90% field-level accuracy on a 50-circular golden set (printed Bangla + English) for deadline, fee, age limit, org; every extracted date shown with its source snippet; nothing auto-saved without user confirmation; extraction p95 < 20 s; failed extraction falls back to manual form pre-filled with OCR text; quota enforced (Free 10/month).

### 4.4 Eligibility & age-limit engine [MVP]
- Age computed on the circular's `ageReferenceAt` (fallback: circular publish date) with BD convention (years, months, days). Applies declared quota relaxations from the circular (never hard-coded; e.g. some circulars give higher max age for specific quotas — verify per circular).
- Education match: user's highest level/subject/result vs `requirements.minEducation`/subjects/min result (rule DSL in JSON, see backend spec).
- Outputs: `ELIGIBLE | NOT_ELIGIBLE(reason) | CHECK_MANUALLY`, plus **age-out countdown**: "You can apply to govt jobs with max age 32 for 7 more months."
- **AC:** unit tests for leap years, DOB on reference date, missing DOB → CHECK_MANUALLY; engine never blocks saving — it only advises.

### 4.5 Schedule, calendar & "Today" [MVP]
- `ScheduleItem` kinds: apply start/deadline, fee deadline, admit card, seat plan, prelim/written/practical exam, viva, interview, result, doc submission, medical, police verification, joining, custom.
- Views: Agenda (Today / This week), month calendar, per-application timeline. Conflict detection (two exams same day/time slot → warning; BD exams often clash on Fridays).
- ICS export + subscribable private calendar URL (tokenized) for Google Calendar.
- **AC:** creating an application with deadline auto-creates APPLY_DEADLINE (+ FEE_DEADLINE = submission + 72h when feeChannel = TELETALK_SMS — configurable, *verify per circular*); clash warning when two exam items overlap; ICS validates in Google Calendar.

### 4.6 Reminders & notifications [MVP]
- Default ladder per kind: deadlines −7d, −3d, −1d, −3h; fee deadline −24h, −6h, −1h; exam −3d (prep nudge), −1d 8pm ("admit card + pen + NID ready?"), −3h; viva −2d (mock viva CTA).
- Channels: local notification (scheduled on device, works offline) + server push + email; SMS only for `critical` (fee deadline −6h, exam −1d) when user opted in and has Pro or SMS credits.
- Quiet hours (default 23:00–07:00 Asia/Dhaka): non-critical shifted to 07:30.
- Dedupe: `dedupeKey = scheduleItemId:offset:channel`; device-local notifications use the same key so the server suppresses push if the app ACKs the local one (v2 optimization).
- Daily digest 8:00 ("Aj 2 ta deadline, 1 ta exam"), weekly report Friday 10:00.
- **AC:** changing a deadline reschedules all pending reminders atomically; deleting an application cancels them; no user receives the same reminder twice on the same channel; reminder worker lag p99 < 60 s.

### 4.7 Document vault [MVP]
- Kinds: CV, cover letter, photo, signature, certificates, transcripts, NID, birth certificate, experience letters, admit cards, applicant copies, payment slips.
- **Teletalk-ready presets** (client-side with expo-image-manipulator / canvas on web, server verifies): photo 300×300 px ≤100 KB, signature 300×80 px ≤60 KB (BPSC/Teletalk norms seen in 2026 circulars — *verify per circular*); passport photo 45×55 mm; PDF compression ≤1 MB. Background whitening & auto-crop (v2, on-device ML).
- "Photo age" warning (BPSC asks for a photo taken within ~2 months — verify).
- Security: private bucket, per-user data key (envelope encryption), signed URLs (5 min), biometric/PIN unlock on mobile, audit log for view/download/share, expiring share links.
- **AC:** preset output always meets size/dimension limits (property tests); original never publicly reachable; every download writes an AuditLog row; Free quota 100 MB.

### 4.8 CV studio & ATS score [v2]
- Structured resume (JSON Resume-like), Bangla + English templates, PDF export (server-side, React-PDF or Playwright).
- ATS score: deterministic keyword/section/format score (hard skills, soft skills, education, title match, formatting) + optional LLM suggestions; *heuristic, not a real employer ATS* — UI must say so (Jobscan does the same; source #13).
- Tailor: creates child resume from base for a specific application, diff view, never invents experience (LLM prompt + post-check: tailored content must be grounded in base resume facts).
- **AC:** score reproducible for same inputs (deterministic part); tailoring cannot add employers/degrees not present in base (validator test).

### 4.9 Prep tracker [v2]
- Syllabus templates seeded (50th BCS prelim: Bangla 30, English 30, Bangladesh affairs 25, International 25, Geography 10, Science 15, ICT 15, Math reasoning 20, Mental ability 15, Ethics 15 — source #14; verify each new BCS).
- Study timer (Pomodoro), manual log, subject coverage heatmap vs marks weight, "weakest-high-weight subject" recommendation.
- MCQ engine: practice by subject/topic, daily 10, full 200-mark mock with negative marking (configurable per exam), FSRS spaced repetition for wrong answers.
- Content policy: original questions, public past exam questions (exam questions are public; explanations must be original), AI-generated **only after human review** (`reviewed=true`).
- **AC:** FSRS scheduling unit-tested; mock scoring with negative marking matches manual calc; study minutes count toward streak.

### 4.10 Interview notes & mock viva [MVP notes, v2 AI]
- Notes per round: board members, questions asked, my answer, ideal answer, self-rating.
- AI mock viva: personalised by post, cadre choices, home district, subject, hobbies (classic BCS viva pattern: "Tell me about your district", "Why foreign cadre?"); text Q&A with feedback rubric (content, clarity, confidence, Bangla/English fluency); voice in v2.5 (STT/TTS vendor — verify Bangla quality).
- Opt-in anonymized sharing → community viva bank per post (moderated; PII scrubbed).
- **AC:** AI never claims to know actual board questions; every session stores rubric scores; anonymization strips names/phones/roll numbers (regex + LLM check).

### 4.11 Follow-a-circular & community updates [v2]
- Users follow a canonical PUBLIC circular. Updates: admit card, seat plan, exam date, date change, result, viva schedule, corrigendum, cancelled.
- Trust model: an update is **auto-verified** only if its URL's host is on the official allow-list (bpsc.gov.bd, *.teletalk.com.bd, erecruitment.bb.org.bd, bangladesh.gov.bd, *.gov.bd …); otherwise needs moderator or reputation ≥ threshold + 3 upvotes. Verified updates fan out push to followers; unverified show as "community report".
- **AC:** fan-out to 10k followers completes < 2 min; duplicates (same circular+kind+url) merged; abusive users rate-limited & shadow-banned.

### 4.12 Engagement: streaks, badges, digest [MVP streak, v2 rest]
- A "streak day" = any meaningful action in Asia/Dhaka day: add/update application, complete checklist item, ≥15 study minutes, quiz of ≥10 Qs, mock viva.
- Streak freeze: 1 free per week, max 2 banked (Duolingo found 2 freezes increased DAU; more didn't help — source #15).
- Badges (FIRST_APPLICATION, TEN_APPLICATIONS, STREAK_7/30, FIRST_VIVA, CIRCULAR_HERO).
- Weekly "Chakri Report" share card (applications, study hours, streak) → image for Facebook/WhatsApp with referral link.
- **AC:** streak computed server-side from ActivityDay (client shows optimistic value); timezone edge (23:59 vs 00:01 Dhaka) tested; freeze auto-applies once.

### 4.13 Billing (Pro) [v2]
- Plans (BDT, test with users before fixing): **Free** — 30 active applications, 10 AI captures/mo, 100 MB vault, push/email reminders. **Pro ৳99/mo or ৳249/quarter or "Exam season pass" ৳199/3 mo** — unlimited applications, 100 AI captures/mo, CV tailoring, mock viva, 2 GB vault, SMS critical reminders (capped), advanced stats. **Pro+** (v3) — coaching content partners.
- bKash Tokenized Checkout: agreement (`mode 0000`) → execute → store agreementID (encrypted) → recurring charges/pay-with-agreement (`mode 0001`); one-off checkout (`mode 0011`) for season pass. Base URL/credentials come from bKash onboarding (source #16). Nagad/SSLCommerz later.
- **AC:** payment callbacks idempotent (`idempotencyKey`, `providerPaymentId` unique); always re-query payment status server-side before granting; grace period 3 days on PAST_DUE; downgrade never deletes data (read-only over limits).

### 4.14 Referral & growth hooks [MVP basic, v2 rewards]
- Referral code per user; referee qualifies after phone verify + 3 applications; reward: +14 days Pro for both (cap 6 months/yr).
- Share circular card (deadline countdown image) → deep link `chakritrack://c/<id>` / web `/c/<slug>`; opens in app or web with "Track this circular" CTA.
- Public SEO pages: `/circulars/<slug>` (verified public circulars: deadline countdown, fee, age-limit calculator, "Add to my tracker"), `/tools/age-calculator`, `/tools/photo-resizer` (Teletalk photo/signature resizer — strong organic tool).
- **AC:** share card renders < 1 s (edge OG image); referral fraud checks (same device/IP, OTP phone reuse).

### 4.15 Admin & moderation [MVP minimal]
- Web admin: circular review/publish, update verification, user reports, question review, AI cost dashboard, feature flags, broadcast (rate-limited).
- **AC:** all admin actions audit-logged; RBAC enforced server-side.

---

## 5. Advanced business logic

### 5.1 Reminder scheduling algorithm
```
on ScheduleItem upsert (tx):
  offsets = user.overrides[kind] ?? DEFAULT_LADDER[kind]
  for each offset, channel in enabledChannels(user, kind, criticality):
     fireAt = startsAt + offset
     if fireAt < now: skip (unless offset is the smallest and startsAt > now → fire ASAP)
     fireAt = shiftOutOfQuietHours(fireAt, user) unless critical
     upsert Reminder(dedupeKey = id:offset:channel, status=PENDING, fireAt)
  cancel reminders whose dedupeKey not in new set
worker (every 30s, BullMQ repeatable + SKIP LOCKED):
  SELECT ... WHERE status='PENDING' AND fireAt <= now()+30s FOR UPDATE SKIP LOCKED LIMIT 500
  → mark QUEUED → enqueue send job (jobId = dedupeKey) → driver → SENT/FAILED (retry 3x exp backoff)
```
Mobile also schedules local notifications for the next 30 days of items (OS limits: keep ≤ 60 scheduled), refreshed on sync and app open.

### 5.2 Offline-first sync (mobile)
- Local SQLite mirrors user-owned tables (applications, schedule items, checklist, notes, study sessions).
- Writes go to local DB + outbox (op, entity, clientId, payload, baseVersion).
- `POST /sync/push` applies ops idempotently (clientId unique per user); conflict when `baseVersion != version`: field-level last-writer-wins for scalar fields, *except* `stage` (higher-progress stage wins unless the other side is terminal & newer) and notes (append both with conflict marker).
- `GET /sync/pull?since=<cursor>` returns changed rows incl. tombstones (`deletedAt`), cursor = (updatedAt, id).
- **AC:** airplane-mode create/edit/delete then reconnect → server state equals device state; no duplicates after retrying the same push 3×.

### 5.3 Circular dedupe & canonicalization
`contentHash = sha256(normalize(orgName) | deadlineDate | sort(normalize(postNames)).join(','))`, normalize = lowercase, strip punctuation, Bangla digits→ASCII, collapse spaces. Fuzzy fallback: pg_trgm similarity on title+org within ±3 days of deadline → suggest merge to moderator.

### 5.4 AI extraction quality loop
- Prompt + JSON schema versioned (`promptVer`); every user correction on the review screen is stored as a diff → golden set grows → weekly eval job reports field accuracy by model/prompt version.
- Model routing: cheap text model for clean text/links; vision model for photos/PDF scans; Tesseract `ben+eng` OCR as offline/fallback (quality lower — Bangla OCR on noisy scans remains hard; source #17).
- Never trust LLM dates blindly: cross-check that deadline ≥ publish date and within 120 days; otherwise mark low-confidence.

### 5.5 Eligibility rule DSL (JSON)
```json
{ "all": [
  { "minEducation": "BACHELOR_HONS" },
  { "anySubject": ["CSE", "EEE", "ICT"] },
  { "minResult": { "type": "CGPA", "value": 2.5, "scale": 4 } },
  { "ageMax": 30, "relaxations": [{ "quota": "FREEDOM_FIGHTER_DESCENDANT", "ageMax": 32 }] },
  { "districts": ["Rajshahi", "Natore"] }
]}
```
Evaluated server-side and on-device (shared TS package `packages/rules` in v2 or duplicated pure function with shared test vectors).

### 5.6 Streak computation
`ActivityDay(date in Asia/Dhaka)`; nightly job at 00:05 Dhaka: for users active yesterday → current+1; else if freezesAvailable>0 and current>0 → consume freeze, mark frozen; else reset to 0. Grant +1 freeze each Monday (max 2).

### 5.7 Quotas & AI budget
Per-user monthly counters in Redis (`ai:{userId}:{feature}:{yyyymm}`) + durable `AiUsage` rows; global daily budget guard — when spend > budget, AI features degrade (queue + "processing later" message) rather than error.

### 5.8 Edge cases
- Circular deadline extended (corrigendum) → update canonical circular → all linked applications' schedule items move → reminders reschedule → push "Deadline extended to …".
- User applies to multiple posts in one circular → one Application per post (common in non-cadre), grouped in UI.
- Exam cancelled/postponed (common) → schedule item status + reminder cancel + notification.
- DOB unknown → eligibility = CHECK_MANUALLY.
- Phone number change → OTP on both numbers or support flow.
- Account deletion → hard-delete documents from storage within 30 days, anonymize community posts.

---

## 6. Data model (summary)
Full Prisma schema: `backend/prisma/schema.prisma` (source of truth). Domains:

| Domain | Models |
|---|---|
| Identity | User, Session, OtpCode, Device, Education |
| Circular catalog | Organization, Circular, CircularPost, CircularExtraction, CircularFollow, CircularUpdate, CircularUpdateVote |
| Tracking | Application, ApplicationEvent, ChecklistItem, ScheduleItem, Reminder, InterviewNote, Contact |
| Vault | Document, DocumentVariant, ApplicationDocument, ShareLink |
| CV | Resume, ResumeScore |
| Prep | PrepPlan, SyllabusTemplate, StudySession, Question, QuizAttempt, QuizAnswer, ReviewCard (FSRS), MockVivaSession |
| Engagement | Streak, ActivityDay, Badge, UserBadge, Referral, Notification |
| Billing/ops | Subscription, Payment, AiUsage, AuditLog |

Conventions: cuid ids; money in poisha ints (`*Minor`); UTC timestamps, Asia/Dhaka for display & day boundaries; syncable rows have `version`, `clientId`, `deletedAt`; encrypted columns marked `/// @encrypted`.

---

## 7. REST API (v1, prefix `/api/v1`)
Detailed request/response shapes live in `backend/Project_spec.md §7`. Summary:

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/otp/request`, `POST /auth/otp/verify`, `POST /auth/google`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/sessions`, `DELETE /auth/sessions/:id` |
| Me | `GET/PATCH /me`, `PUT /me/educations`, `GET /me/eligibility-summary`, `DELETE /me` (account deletion), `GET /me/export` (data export) |
| Devices | `POST /devices`, `DELETE /devices/:id` |
| Applications | `GET/POST /applications`, `GET/PATCH/DELETE /applications/:id`, `POST /applications/:id/move` (stage+position), `POST /applications/bulk`, `GET /applications/:id/events`, checklist `POST/PATCH/DELETE /applications/:id/checklist[/:itemId]`, `GET /applications/:id/eligibility`, `POST /applications/:id/reveal-credentials` (step-up auth) |
| Circulars | `GET /circulars` (public, verified), `GET /circulars/:idOrSlug`, `POST /circulars/:id/follow`, `DELETE /circulars/:id/follow`, `GET /circulars/:id/updates`, `POST /circulars/:id/updates`, `POST /circular-updates/:id/vote` |
| Extraction | `POST /extractions` (multipart or {url|text}), `GET /extractions/:id`, `POST /extractions/:id/confirm` (→ application + schedule), `POST /extractions/sms-parse` |
| Schedule | `GET /schedule?from&to`, `POST/PATCH/DELETE /schedule/:id`, `GET /schedule/today`, `GET /calendar/:token.ics` (public tokenized) |
| Reminders | `GET /reminders?status`, `PATCH /me/reminder-preferences` |
| Documents | `POST /documents/upload-url` (presigned PUT), `POST /documents` (finalize), `GET /documents`, `GET /documents/:id/download-url`, `POST /documents/:id/variants`, `DELETE /documents/:id`, `POST /documents/:id/share` |
| Resumes | `GET/POST /resumes`, `PATCH/DELETE /resumes/:id`, `POST /resumes/:id/score`, `POST /resumes/:id/tailor`, `POST /resumes/:id/pdf` |
| Prep | `GET /syllabus-templates`, `GET/POST /prep-plans`, `POST /study-sessions`, `GET /prep/stats`, `POST /quiz/attempts`, `POST /quiz/attempts/:id/answers`, `POST /quiz/attempts/:id/finish`, `GET /review/due` |
| Viva | `POST /viva/sessions`, `POST /viva/sessions/:id/turns`, `POST /viva/sessions/:id/finish` |
| Interview notes | `GET/POST /applications/:id/interview-notes`, `PATCH/DELETE /interview-notes/:id` |
| Engagement | `GET /streak`, `GET /badges`, `GET /reports/weekly`, `GET /referrals` |
| Notifications | `GET /notifications`, `POST /notifications/read` |
| Billing | `GET /billing/plans`, `POST /billing/checkout`, `GET /billing/bkash/callback`, `POST /billing/cancel`, `GET /billing/subscription` |
| Sync | `POST /sync/push`, `GET /sync/pull` |
| Admin | `/admin/circulars*`, `/admin/updates*`, `/admin/questions*`, `/admin/users*`, `/admin/ai-usage`, `/admin/broadcast` |
| Ops | `GET /health` |

Conventions: JSON, camelCase, cursor pagination (`?cursor&limit≤100`), errors `{ error: { code, message, details } }`, `Idempotency-Key` header on POSTs that create money/AI work, OpenAPI at `/api/docs` (dev only).

---

## 8. Background jobs (BullMQ queues)

| Queue / job | Schedule | Purpose |
|---|---|---|
| `reminders.scan` | every 30 s | pick due reminders (SKIP LOCKED) → `reminders.send` |
| `reminders.send` | on demand | deliver via push/email/SMS driver, retries 3× |
| `extraction.run` | on demand | OCR/LLM extraction, concurrency-limited, timeout 60 s |
| `circular.fanout` | on verified update | notify followers in batches of 500 |
| `circular.deadline-sync` | on circular change | propagate deadline changes to linked applications |
| `digest.daily` | 08:00 Dhaka | today's items per user (only if any) |
| `digest.weekly` | Fri 10:00 Dhaka | weekly report + share card |
| `streak.rollover` | 00:05 Dhaka | streak/freeze computation |
| `billing.renew` | hourly | charge due bKash agreements, mark PAST_DUE, expire |
| `documents.variants` | on upload | server-side verify/generate preset variants, thumbnails |
| `documents.purge` | daily | hard-delete soft-deleted docs > 30 days, orphaned uploads |
| `ai.eval` | weekly | run golden set against current prompt/model |
| `board.rebalance` | nightly | rebalance long fractional keys |
| `analytics.rollup` | nightly | KPI tables (WAU, retention cohorts, funnel) |

---

## 9. Notifications matrix

| Event | Push | Local | Email | SMS | In-app |
|---|---|---|---|---|---|
| Deadline −7d/−3d/−1d/−3h | ✓ | ✓ | −1d | − | ✓ |
| Fee deadline −24h/−6h/−1h | ✓ | ✓ | −24h | −6h (opt-in/Pro) | ✓ |
| Exam −1d 20:00 / −3h | ✓ | ✓ | −1d | −1d (opt-in/Pro) | ✓ |
| Viva −2d | ✓ | ✓ | ✓ | − | ✓ |
| Verified circular update (followed) | ✓ | − | digest | − | ✓ |
| Streak at risk (21:00 if no activity) | ✓ | ✓ | − | − | − |
| Daily digest / weekly report | ✓ | − | ✓ | − | ✓ |
| Payment success/failure | ✓ | − | ✓ | − | ✓ |

Limits: max 6 non-critical pushes/user/day; SMS budget guard (`SMS_MONTHLY_BUDGET_BDT`); SMS via BTRC-enlisted A2P aggregator (masking sender ID needs trade licence; ~৳0.3–0.6/SMS — source #18, verify).

---

## 10. Security & privacy
- **Law:** Bangladesh Personal Data Protection Act 2026 (Act No. 63 of 2026; replaced the 2025 Ordinance; some provisions pending notification — source #19, get legal review). Design for consent, purpose limitation, data export & deletion, breach notification.
- Documents: private bucket; envelope encryption (per-user DEK encrypted by KEK in KMS/env); signed URLs ≤5 min; downloads audit-logged; share links expiring, view-capped, revocable.
- Sensitive fields (portal password, bKash agreementID) AES-256-GCM at app layer; never logged; reveal requires step-up (biometric on device + fresh token < 5 min).
- Auth: OTP hashed, rate limits (IP + phone), refresh rotation with reuse detection, JWT access 15 min.
- Mobile: expo-secure-store for tokens, optional app lock (expo-local-authentication), screenshot blocking on vault screens (Android FLAG_SECURE via config plugin — verify), no documents cached unencrypted.
- AI: send minimum data to LLM providers; strip NID/phone from prompts; provider with no-training data terms; disclose in privacy policy.
- Web: strict CSP, HttpOnly cookies for web session, CSRF protection on cookie-auth routes, input validation with Zod/Standard Schema.
- OWASP ASVS L2 checklist before public launch; dependency audit in CI; secrets only via env/secret manager.

## 11. Legal / data-source policy (scraping limits)
- **Official govt portals** (bpsc.gov.bd, Teletalk subdomains, bangladesh.gov.bd): link + summarize public circular facts; store the official URL; low-rate polling only of *public notice pages* for moderators (v2), honor robots.txt, identify our bot, cache. *Verify each portal's terms before automating.*
- **Bdjobs:** robots.txt disallows all non-whitelisted crawlers (`User-agent: * Disallow: /`) — **no crawling**. Users may paste a link/screenshot of a job they're viewing; we extract from what the user provides. Pursue partnership/API if traction (source #20).
- **LinkedIn:** User Agreement prohibits scraping/automated access — user-provided paste/screenshot only.
- **Newspaper circulars** (Prothom Alo, Ittefaq job pages): user photos only; don't republish full images publicly (copyright) — public pages show extracted facts + link to official source.
- **MCQ content:** no copying of commercial question banks/guide books; original + public exam questions + reviewed AI content.

## 12. Performance & reliability targets
- API p95 < 250 ms (CRUD), < 800 ms (search); extraction p95 < 20 s async.
- Mobile cold start < 2.5 s on a ৳15k Android (Snapdragon 6xx / Helio G-series class); APK/AAB download < 30 MB; works on 3G.
- Web LCP < 2.0 s on 4G for landing/SEO pages (static/ISR).
- Availability 99.5% (MVP), reminders delivery SLO 99.9% before due time.
- Scale target: 50k users, 1.5M applications, 10M reminders/yr on 1 small Postgres (2 vCPU/4 GB) + 1 API + 1 worker.
- Indexing per §6; `pg_trgm` for circular search; partition `Reminder`/`Notification` by month when > 20M rows.

## 13. Analytics & KPIs
Event taxonomy (PostHog or self-hosted, consent-aware): `signup_completed`, `onboarding_completed`, `application_created{source}`, `circular_capture_started/confirmed{input}`, `stage_changed{from,to}`, `reminder_sent/opened{kind,channel}`, `document_uploaded{kind,preset}`, `study_session_logged`, `quiz_finished`, `viva_finished`, `streak_extended/frozen/broken`, `share_card_created`, `referral_qualified`, `checkout_started/succeeded`.

| KPI | Target |
|---|---|
| Activation (≥3 applications or 1 capture + reminder within 48h) | ≥ 45% of signups |
| WAU / MAU | ≥ 0.5 |
| W1 / W4 retention (activated) | ≥ 55% / ≥ 35% |
| Captures per WAU per week | ≥ 1.5 |
| Reminder open rate | ≥ 25% |
| Viral coefficient (invites → signups) | ≥ 0.3 |
| Free → Pro conversion (90-day) | 2–3% |
| AI cost per WAU / month | < ৳3 |

## 14. Monetization (BD-realistic)
1. Pro subscription via bKash (monthly/quarterly/season pass) — §4.13.
2. AI packs (one-off, e.g. ৳49 for 30 extra captures/tailors) via bKash checkout.
3. Partnerships (v3): coaching centers' sponsored prep content clearly labeled; *no* selling of personal data, ever.
4. B2B/University career offices (v3): aggregated, anonymized placement analytics with consent.
Pricing must be validated via in-app surveys + fake-door tests before launch.

## 15. In-product growth hooks
- Free web tools (SEO): Teletalk photo/signature resizer, age-limit calculator, BCS countdown, circular deadline pages.
- Shareable deadline countdown cards + weekly report cards (Facebook groups/WhatsApp/Messenger are where aspirants live).
- Follow-a-circular brings group admins: "Share this tracker link to your group".
- Referral +14 days Pro both sides.
- Campus ambassador kit (v2) — referral leaderboard per university.
- Bangla-first content: in-app "How to apply on Teletalk" guides.

## 16. Release plan & milestones (summary — detail in AGENTS.md)
M0 scaffold (done) → M1 auth+onboarding → M2 applications/kanban/sync → M3 schedule+reminders+push → M4 circular capture v1 + vault v1 → **MVP launch (closed beta 200 users from BCS FB groups)** → M5 prep+streak → M6 CV studio + mock viva → M7 billing + follow-a-circular → public launch → M8 community/seat-plan/result alerts.

## 17. Open questions / verify list
- bKash merchant onboarding requirements & recurring-payment approval timeline for a sole proprietor (verify with bKash).
- Teletalk fee window (72h) and photo/signature specs vary per circular — always read from circular; defaults are hints.
- Current Google Play policy on SMS/Call Log permissions and FLAG_SECURE; Play Console developer verification requirements 2026.
- Best Bangla OCR/vision model price-performance at launch time (run our golden-set eval; don't assume).
- Personal Data Protection Act 2026 notified provisions & data-localization implications for using foreign cloud/LLM providers.
- SMS aggregator choice and masking approval time.
