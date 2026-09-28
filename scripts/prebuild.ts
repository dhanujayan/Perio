/**
 * Runs before `next build`.
 * - Netlify Database (NETLIFY_DB_URL set): nothing to do; Netlify applies the migrations.
 * - External Postgres (DATABASE_URL set): apply migrations so the schema matches the code.
 * - Neither (e.g. a plain local build): skip.
 */
import { runMigrations } from './migrate';

async function main() {
  if (process.env.NETLIFY_DB_URL) {
    console.log('prebuild: Netlify Database detected; Netlify applies migrations.');
    return;
  }
  if (process.env.DATABASE_URL && process.env.SKIP_MIGRATIONS !== 'true') {
    console.log('prebuild: applying migrations to DATABASE_URL');
    await runMigrations();
    console.log('prebuild: migrations applied');
    return;
  }
  console.log('prebuild: no database configured; skipping migrations.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
