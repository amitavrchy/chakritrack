import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    // A placeholder keeps `prisma validate` / `prisma generate` working without a .env
    url: process.env['DATABASE_URL'] ?? 'postgresql://chakritrack:local-development-only@localhost:5545/chakritrack',
  },
});
