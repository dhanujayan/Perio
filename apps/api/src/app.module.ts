import { Controller, Get, Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { sql } from 'drizzle-orm';
import { AuthModule } from './auth/auth.module';
import { loadConfig } from './config';
import { ContentModule } from './content/content.module';
import { DbModule, InjectDb, type Database } from './db/db.module';
import { InboxModule } from './inbox/inbox.module';
import { APP_CONFIG } from './tokens';

@Global()
@Module({
  providers: [{ provide: APP_CONFIG, useFactory: () => loadConfig() }],
  exports: [APP_CONFIG],
})
class ConfigModule {}

@Controller('health')
class HealthController {
  constructor(@InjectDb() private readonly db: Database) {}

  @Get()
  async check() {
    await this.db.execute(sql`select 1`);
    return { status: 'ok' };
  }
}

@Module({
  imports: [
    ConfigModule,
    DbModule,
    // Default: 120 requests a minute per IP; forms and login set stricter limits
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 120 }]),
    AuthModule,
    ContentModule,
    InboxModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
