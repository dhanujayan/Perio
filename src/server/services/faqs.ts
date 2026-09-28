import { and, asc, desc, eq, ilike, isNotNull, isNull, ne, or, sql, type SQL } from 'drizzle-orm';
import { getDb } from '../db';
import { notFound } from '../http';
import { categories, faqs, users, type Faq } from '../schema';
import type { AdminContentQuery, CreateFaq, ListQuery, UpdateFaq } from '../validation';
import { assertCategory, likePattern, toPrefixTsQuery, uniqueSlug, type Paged } from './util';

const faqVector = sql`to_tsvector('english', ${faqs.question} || ' ' || ${faqs.summary} || ' ' || ${faqs.answer})`;

// Changing any of these on a reviewed FAQ clears its clinical review
const CLINICAL_FIELDS = ['question', 'summary', 'answer', 'references', 'audience'] as const;

const listColumns = {
  id: faqs.id,
  slug: faqs.slug,
  audience: faqs.audience,
  question: faqs.question,
  summary: faqs.summary,
  tags: faqs.tags,
  reviewedAt: faqs.reviewedAt,
  updatedAt: faqs.updatedAt,
  category: { slug: categories.slug, name: categories.name },
};

export type FaqListItem = Awaited<ReturnType<typeof listPublishedFaqs>>['items'][number];

// ---------- Public ----------

export async function listPublishedFaqs(query: ListQuery) {
  const db = getDb();
  const tsq = toPrefixTsQuery(query.q);
  if (query.q && !tsq) {
    return { items: [], total: 0, page: query.page, pageSize: query.pageSize } as Paged<never>;
  }

  const where: SQL[] = [eq(faqs.status, 'PUBLISHED')];
  if (query.audience) where.push(eq(faqs.audience, query.audience));
  if (query.category) where.push(eq(categories.slug, query.category));
  if (tsq) where.push(sql`${faqVector} @@ to_tsquery('english', ${tsq})`);

  const order = tsq
    ? [desc(sql`ts_rank(${faqVector}, to_tsquery('english', ${tsq}))`), desc(faqs.viewCount)]
    : [asc(categories.sortOrder), desc(faqs.viewCount), asc(faqs.question)];

  const [items, [{ total }]] = await Promise.all([
    db
      .select(listColumns)
      .from(faqs)
      .innerJoin(categories, eq(faqs.categoryId, categories.id))
      .where(and(...where))
      .orderBy(...order)
      .limit(query.pageSize)
      .offset((query.page - 1) * query.pageSize),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(faqs)
      .innerJoin(categories, eq(faqs.categoryId, categories.id))
      .where(and(...where)),
  ]);
  return { items, total, page: query.page, pageSize: query.pageSize };
}

export async function getPublishedFaq(slug: string, { countView = true } = {}) {
  const db = getDb();
  const [row] = await db
    .select({
      faq: faqs,
      category: { id: categories.id, slug: categories.slug, name: categories.name },
      reviewerName: users.name,
    })
    .from(faqs)
    .innerJoin(categories, eq(faqs.categoryId, categories.id))
    .leftJoin(users, eq(faqs.reviewedById, users.id))
    .where(and(eq(faqs.slug, slug), eq(faqs.status, 'PUBLISHED')))
    .limit(1);
  if (!row) throw notFound('Question not found');

  const related = await db
    .select(listColumns)
    .from(faqs)
    .innerJoin(categories, eq(faqs.categoryId, categories.id))
    .where(
      and(
        eq(faqs.status, 'PUBLISHED'),
        eq(faqs.categoryId, row.faq.categoryId),
        eq(faqs.audience, row.faq.audience),
        ne(faqs.id, row.faq.id),
      ),
    )
    .orderBy(desc(faqs.viewCount))
    .limit(5);

  if (countView) {
    // Keep updated_at unchanged: a view is not an edit
    await db
      .update(faqs)
      .set({ viewCount: sql`${faqs.viewCount} + 1`, updatedAt: sql`${faqs.updatedAt}` })
      .where(eq(faqs.id, row.faq.id))
      .catch(() => undefined);
  }

  const { reviewedById: _r, viewCount: _v, status: _s, ...faq } = row.faq;
  return { ...faq, category: row.category, reviewerName: row.reviewerName, related };
}

export function faqSitemap() {
  return getDb()
    .select({ slug: faqs.slug, updatedAt: faqs.updatedAt })
    .from(faqs)
    .where(eq(faqs.status, 'PUBLISHED'));
}

// ---------- Admin ----------

export function adminListFaqs(query: AdminContentQuery) {
  const where: SQL[] = [];
  if (query.status) where.push(eq(faqs.status, query.status));
  if (query.audience) where.push(eq(faqs.audience, query.audience));
  if (query.reviewed === 'true') where.push(isNotNull(faqs.reviewedAt));
  if (query.reviewed === 'false') where.push(isNull(faqs.reviewedAt));
  if (query.q) where.push(or(ilike(faqs.question, likePattern(query.q)), ilike(faqs.summary, likePattern(query.q)))!);
  return getDb()
    .select({ ...listColumns, status: faqs.status, viewCount: faqs.viewCount, publishedAt: faqs.publishedAt })
    .from(faqs)
    .innerJoin(categories, eq(faqs.categoryId, categories.id))
    .where(where.length ? and(...where) : undefined)
    .orderBy(desc(faqs.updatedAt))
    .limit(500);
}

export async function adminGetFaq(id: string) {
  const [row] = await getDb()
    .select({ faq: faqs, reviewerName: users.name })
    .from(faqs)
    .leftJoin(users, eq(faqs.reviewedById, users.id))
    .where(eq(faqs.id, id))
    .limit(1);
  if (!row) throw notFound('FAQ not found');
  return { ...row.faq, reviewerName: row.reviewerName };
}

export async function createFaq(dto: CreateFaq) {
  await assertCategory(dto.categoryId);
  const slug = await uniqueSlug(faqs, dto.slug || dto.question);
  const [row] = await getDb()
    .insert(faqs)
    .values({
      slug,
      audience: dto.audience,
      question: dto.question,
      summary: dto.summary,
      answer: dto.answer,
      references: dto.references || null,
      categoryId: dto.categoryId,
      tags: dto.tags ?? [],
      status: 'DRAFT',
    })
    .returning();
  return row;
}

export async function updateFaq(id: string, dto: UpdateFaq) {
  const current = await adminGetFaq(id);
  if (dto.categoryId) await assertCategory(dto.categoryId);

  const patch: Partial<Faq> = {};
  for (const [key, value] of Object.entries(dto)) {
    if (value !== undefined) (patch as Record<string, unknown>)[key] = value;
  }
  if (dto.references !== undefined) patch.references = dto.references || null;
  if (dto.slug && dto.slug !== current.slug) patch.slug = await uniqueSlug(faqs, dto.slug, id);

  const clinicalChange = CLINICAL_FIELDS.some((k) => {
    const next = k === 'references' ? patch.references : dto[k];
    return next !== undefined && next !== current[k];
  });
  const reviewCleared = clinicalChange && !!current.reviewedAt;
  if (reviewCleared) {
    patch.reviewedAt = null;
    patch.reviewedById = null;
  }
  const [row] = await getDb().update(faqs).set(patch).where(eq(faqs.id, id)).returning();
  return { ...row, reviewCleared };
}

export async function setFaqStatus(id: string, status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED') {
  const current = await adminGetFaq(id);
  const [row] = await getDb()
    .update(faqs)
    .set({ status, publishedAt: status === 'PUBLISHED' ? (current.publishedAt ?? new Date()) : current.publishedAt })
    .where(eq(faqs.id, id))
    .returning();
  return row;
}

export async function markFaqReviewed(id: string, reviewerId: string) {
  await adminGetFaq(id);
  const [row] = await getDb()
    .update(faqs)
    .set({ reviewedAt: new Date(), reviewedById: reviewerId })
    .where(eq(faqs.id, id))
    .returning();
  return row;
}

export async function deleteFaq(id: string) {
  await adminGetFaq(id);
  await getDb().delete(faqs).where(eq(faqs.id, id));
}
