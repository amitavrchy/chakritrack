import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      adapter: new PrismaPg({
        connectionString:
          process.env.DATABASE_URL ??
          'postgresql://chakritrack:local-development-only@localhost:5545/chakritrack',
      }),
    });
  }

  async onModuleInit(): Promise<void> {
    // Connect lazily so the API can boot (and /health can report) even when Postgres is down.
    if (process.env.PRISMA_EAGER_CONNECT === 'true') await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
