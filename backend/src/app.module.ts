import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { HealthController } from './health/health.controller.js';
import { PrismaModule } from './prisma/prisma.module.js';

// Feature modules (auth, applications, circulars, extraction, schedule, reminders,
// documents, resumes, prep, engagement, billing, notifications, admin) are added
// milestone by milestone — see ../AGENTS.md §Build order and Project_spec.md §3.
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
