import { config } from 'dotenv';
config({ path: ['.env.local', '.env'], quiet: true });
import { defineConfig } from 'drizzle-kit';

// drizzle-kit writes migrations to ./drizzle; `npm run db:generate` then copies the SQL files to
// netlify/database/migrations, where Netlify applies them automatically on each deploy.
export default defineConfig({
  schema: './src/server/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || process.env.NETLIFY_DB_URL || '',
  },
  strict: true,
});
