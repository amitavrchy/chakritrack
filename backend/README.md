# ChakriTrack API

NestJS 12 (ESM) + Prisma 7 + PostgreSQL 17 + Redis/BullMQ. Spec: [`Project_spec.md`](./Project_spec.md). Master spec: [`../PROJECT_SPEC.md`](../PROJECT_SPEC.md).

## Setup
```bash
cp .env.example .env
docker compose up -d          # postgres :5545, redis :6389, minio :9010 (console :9011)
npm install                   # postinstall → prisma generate (client in src/generated/prisma)
npm run db:migrate:dev        # first run creates the initial migration
npm run db:seed
npm run start:dev             # http://localhost:4000/api/v1/health
```

## Scripts
| Script | Purpose |
|---|---|
| `start:dev` | watch mode |
| `build` / `start:prod` | compile to `dist/` / run |
| `typecheck` | `tsc --noEmit` |
| `test` / `test:e2e` | Vitest unit / e2e |
| `lint` | oxlint (type-aware) |
| `db:validate` / `db:generate` | Prisma validate / generate |
| `db:migrate:dev` / `db:migrate` | dev migrations / deploy |
| `db:seed` / `db:studio` | seed reference data / Prisma Studio |

## Notes
- Prisma 7 uses `prisma.config.ts` for the datasource URL and the `@prisma/adapter-pg` driver adapter (see `src/prisma/prisma.service.ts`).
- Pinned to Prisma 7.10.1 — npm `latest` currently points to an 8.0 RC; don't upgrade until stable.
- If `npm install` crashes with `Cannot read properties of null (reading 'edgesOut')` (npm 10 arborist bug), run `npx npm@latest install`.
