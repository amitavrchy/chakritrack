# AGENTS.md — ChakriTrack mobile (`apps/mobile/`)

Read `../../PROJECT_SPEC.md` (what) and `../../AGENTS.md` (how, milestones) first. Android-first (most users on ৳15–25k Android phones, patchy 3G/4G); iOS supported but secondary.

## Target stack (add per milestone with `npx expo install`)
Expo SDK 58 · RN 0.88 · TypeScript · **expo-router** (move to `src/app/` in M1, delete `App.tsx`/`index.ts` entry accordingly) · **expo-sqlite** (offline DB; optionally Drizzle ORM for typed queries — check SDK 58 compatibility) · TanStack Query (server state for non-synced data) · Zustand (UI state) · **expo-notifications** (push + scheduled local) · **expo-secure-store** (tokens, keys) · **expo-local-authentication** (vault/app lock) · **expo-image-picker / expo-camera / expo-document-picker** (capture) · **expo-image-manipulator** (Teletalk presets) · **expo-file-system** · **expo-sharing** · **expo-background-task** (deferrable sync) · expo-localization + i18next (bn/en) · expo-font (Noto Sans Bengali / Hind Siliguri) · EAS Build/Update.

## Screens (expo-router)
```
src/app/
  _layout.tsx                 # providers: i18n, query, db, auth gate
  (auth)/ phone.tsx, otp.tsx, onboarding/[step].tsx
  (tabs)/ _layout.tsx
          index.tsx           # Today: due items, fee timers, streak, quick capture FAB
          board.tsx           # kanban (horizontal stage columns, long-press drag)
          calendar.tsx        # agenda + month
          vault.tsx           # documents (biometric gate)
          more.tsx            # prep, CV, settings, plan
  capture/ index.tsx (camera/gallery/PDF/link/text/SMS paste), review/[extractionId].tsx
  application/[id].tsx        # detail: stage, checklist, schedule, docs, notes, credentials (step-up)
  prep/…  viva/…  settings/…
src/
  db/        schema.ts, migrations.ts, repositories/ (applications, schedule, checklist, notes, studySessions)
  sync/      outbox.ts, push.ts, pull.ts, scheduler.ts (foreground + connectivity + background task)
  notifications/ localScheduler.ts (next 30 days, ≤60 scheduled, dedupe keys), push.ts (token register)
  vault/     presets.ts (300×300 ≤100KB, 300×80 ≤60KB: resize → iterative JPEG quality search), secure.ts
  api/       client.ts (generated types), auth.ts (refresh rotation)
  i18n/  theme/  components/  utils/{dhaka.ts, money.ts, banglaDigits.ts}
```

## Offline-first rules
- UI reads from SQLite for synced entities (applications, schedule, checklist, notes, study sessions); writes go to SQLite + outbox in one transaction; sync is opportunistic.
- Every locally-created row gets a `clientId` (cuid/uuid) — server dedupes on it.
- Local notifications are the **primary** reminder path for deadlines (work offline); server push is backup/for remote changes. Use the same dedupe key concept so a reminder isn't shown twice.
- Capture works offline: queue image + metadata, upload when online, notify when extraction done.

## Performance / device constraints
- Target cold start < 2.5 s on low/mid Android; keep JS bundle lean; avoid heavy chart libs (use react-native-svg minimal charts).
- Images: compress before upload (≤1600px long side for circulars).
- Lists: FlashList (check SDK compatibility) or FlatList with memoized rows.
- App size budget: < 30 MB download.

## Security
- Tokens & encryption keys in expo-secure-store only. Vault screens behind biometric/PIN; prevent screenshots on vault & credential screens (config plugin for Android FLAG_SECURE — verify availability in SDK 58).
- Never store decrypted documents in cache dirs beyond the viewing session; purge on app background.

## Play Store
- Don't request READ_SMS / call-log permissions (Play policy). SMS capture = user paste or Android share intent.
- Data safety form: phone, email, documents (encrypted), usage analytics (opt-in).
- Package id: `com.chakritrack.app` (app.json) — change before first release if the domain differs.

## Commands
`npx expo start` · `npx tsc --noEmit` · `npx expo-doctor` · `npx expo lint` · `npx eas-cli@latest build -p android --profile preview`

---

This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
