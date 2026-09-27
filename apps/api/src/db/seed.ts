import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import * as schema from './schema';
import { seedArticles, seedCategories, seedFaqs } from './seed-content';

/**
 * Idempotent: creates the admin account and starter content if missing.
 * Existing rows (matched by email or slug) are left alone, so edits made in the admin survive re-runs.
 */
async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });
  const { users, categories, faqs, articles } = schema;

  const email = (process.env.SEED_ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD || '';
  if (!email || password.length < 10) {
    throw new Error('Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD (10+ characters) in .env');
  }

  const [admin] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!admin) {
    await db.insert(users).values({
      email,
      name: process.env.SEED_ADMIN_NAME || 'Site Admin',
      passwordHash: await bcrypt.hash(password, 12),
      role: 'ADMIN',
    });
    console.log(`Created admin ${email}`);
  }

  for (const [i, c] of seedCategories.entries()) {
    await db
      .insert(categories)
      .values({ ...c, sortOrder: (i + 1) * 10 })
      .onConflictDoNothing({ target: categories.slug });
  }
  const catRows = await db.select().from(categories);
  const catId = (slug: string) => {
    const hit = catRows.find((c) => c.slug === slug);
    if (!hit) throw new Error(`Unknown category ${slug}`);
    return hit.id;
  };

  const now = new Date();
  let createdFaqs = 0;
  for (const f of seedFaqs) {
    const res = await db
      .insert(faqs)
      .values({
        slug: f.slug,
        audience: f.audience,
        question: f.question,
        summary: f.summary,
        answer: f.answer,
        references: f.references ?? null,
        tags: f.tags,
        categoryId: catId(f.category),
        status: 'PUBLISHED',
        publishedAt: now,
        reviewedAt: null, // shown as "awaiting clinical review" until the specialist signs off
      })
      .onConflictDoNothing({ target: faqs.slug })
      .returning({ id: faqs.id });
    createdFaqs += res.length;
  }

  let createdArticles = 0;
  for (const a of seedArticles) {
    const res = await db
      .insert(articles)
      .values({
        slug: a.slug,
        audience: a.audience,
        title: a.title,
        summary: a.summary,
        body: a.body,
        membersOnly: a.membersOnly,
        tags: a.tags,
        categoryId: catId(a.category),
        status: 'PUBLISHED',
        publishedAt: now,
      })
      .onConflictDoNothing({ target: articles.slug })
      .returning({ id: articles.id });
    createdArticles += res.length;
  }

  console.log(
    `Seed complete: ${seedCategories.length} categories, ${createdFaqs} new FAQs, ${createdArticles} new articles`,
  );
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
