import { join } from 'path';
import { existsSync } from 'fs';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { TasksModule } from './tasks/tasks.module';
import { AuthModule } from './auth/auth.module';
import { HealthController } from './health/health.controller';

/** Always find server/.env whether you run Nest from repo root or from /server (fixes missing GOOGLE_* → invalid_client). */
function envFilePaths(): string[] {
  const fromCompiled = join(__dirname, '..', '..', '.env');
  const fromCwd = join(process.cwd(), '.env');
  const fromCwdServer = join(process.cwd(), 'server', '.env');
  return [fromCompiled, fromCwd, fromCwdServer].filter((p) => existsSync(p));
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: envFilePaths().length ? envFilePaths() : undefined,
    }),
    PrismaModule,
    TasksModule,
    AuthModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
