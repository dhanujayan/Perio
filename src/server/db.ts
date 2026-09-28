import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { databaseUrl } from './config';
import * as schema from './schema';

export type Database = NodePgDatabase<typeof schema>;

// One small pool per server instance. Serverless functions are short-lived and many may run at
// once, so keep the pool small and let idle connections close quickly.
const globalForDb = globalThis as unknown as { perioPool?: Pool; perioDb?: Database };

export function getDb(): Database {
  if (!globalForDb.perioDb) {
    const url = databaseUrl();
    const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
    globalForDb.perioPool = new Pool({
      connectionString: url,
      max: 3,
      idleTimeoutMillis: 10_000,
      // Hosted Postgres (Netlify Database, Neon) requires TLS
      ssl: local || /sslmode=/.test(url) ? undefined : { rejectUnauthorized: true },
    });
    globalForDb.perioDb = drizzle(globalForDb.perioPool, { schema });
  }
  return globalForDb.perioDb;
}
