/**
 * Applies the migrations in ./drizzle to DATABASE_URL.
 * Use locally, or when hosting with an external Postgres (e.g. Neon). With Netlify Database
 * you don't need this: Netlify applies netlify/database/migrations on every deploy.
 */
import { config } from 'dotenv';
import path from 'node:path';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

config({ path: ['.env.local', '.env'], quiet: true });

export async function runMigrations(url = process.env.DATABASE_URL) {
  if (!url) throw new Error('Set DATABASE_URL');
  const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
  const pool = new Pool({ connectionString: url, ssl: local || /sslmode=/.test(url) ? undefined : { rejectUnauthorized: true } });
  try {
    await migrate(drizzle(pool), { migrationsFolder: path.resolve(__dirname, '../drizzle') });
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => console.log('Migrations applied'))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
