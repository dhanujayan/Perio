import { and, desc, eq, ilike, isNotNull, isNull, or, sql, type SQL } from 'drizzle-orm';
import type { SessionUser } from '../auth';
import { getDb } from '../db';
import { notFound } from '../http';
import { articles, categories, users, type Article } from '../schema';
import type { AdminContentQuery, CreateArticle, ListQuery, UpdateArticle } from '../validation';
import { assertCategory, likePattern, toPrefixTsQuery, uniqueSlug, type Paged } from './util';

const articleVector = sql`to_tsvector('english', ${articles.title} || ' ' || ${articles.summary} || ' ' || ${articles.body})`;
const CLINICAL_FIELDS = ['title', 'summary', 'body', 'audience'] as const;

const listColumns = {
  id: articles.id,
  slug: articles.slug,
  audience: articles.audience,
  title: articles.title,
  summary: articles.summary,
  membersOnly: articles.membersOnly,
  tags: articles.tags,
  reviewedAt: articles.reviewedAt,
  publishedAt: articles.publishedAt,
  updatedAt: articles.updatedAt,
  category: { slug: categories.slug, name: categories.name },
};

export async function listPublishedArticles(query: ListQuery) {
  const db = getDb();
  const tsq = toPrefixTsQuery(query.q);
  if (query.q && !tsq) {
    return { items: [], total: 0, page: query.page, pageSize: query.pageSize } as Paged<never>;
  }

  const where: SQL[] = [eq(articles.status, 'PUBLISHED')];
  if (query.audience) where.push(eq(articles.audience, query.audience));
  if (query.category) where.push(eq(categories.slug, query.category));
  if (tsq) where.push(sql`${articleVector} @@ to_tsquery('english', ${tsq})`);

  const order = tsq
    ? [desc(sql`ts_rank(${articleVector}, to_tsquery('english', ${tsq}))`)]
    : [desc(articles.publishedAt)];

  const [items, [{ total }]] = await Promise.all([
    db
      .select(listColumns)
      .from(articles)
      .innerJoin(categories, eq(articles.categoryId, categories.id))
      .where(and(...where))
      .orderBy(...order)
      .limit(query.pageSize)
      .offset((query.page - 1) * query.pageSize),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(articles)
      .innerJoin(categories, eq(articles.categoryId, categories.id))
      .where(and(...where)),
  ]);
  return { items, total, page: query.page, pageSize: query.pageSize };
}

/** Members-only bodies are withheld from signed-out visitors. */
export async function getPublishedArticle(slug: string, user: SessionUser | null) {
  const [row] = await getDb()
    .select({
      article: articles,
      category: { id: categories.id, slug: categories.slug, name: categories.name },
      reviewerName: users.name,
    })
    .from(articles)
    .innerJoin(categories, eq(articles.categoryId, categories.id))
    .leftJoin(users, eq(articles.reviewedById, users.id))
    .where(and(eq(articles.slug, slug), eq(articles.status, 'PUBLISHED')))
    .limit(1);
  if (!row) throw notFound('Article not found');

  const { reviewedById: _r, status: _s, ...article } = row.article;
  const locked = article.membersOnly && !user;
  return {
    ...article,
    body: locked ? null : article.body,
    locked,
    category: row.category,
    reviewerName: row.reviewerName,
  };
}

export function articleSitemap() {
  return getDb()
    .select({ slug: articles.slug, updatedAt: articles.updatedAt })
    .from(articles)
    .where(eq(articles.status, 'PUBLISHED'));
}

// ---------- Admin ----------

export function adminListArticles(query: AdminContentQuery) {
  const where: SQL[] = [];
  if (query.status) where.push(eq(articles.status, query.status));
  if (query.audience) where.push(eq(articles.audience, query.audience));
  if (query.reviewed === 'true') where.push(isNotNull(articles.reviewedAt));
  if (query.reviewed === 'false') where.push(isNull(articles.reviewedAt));
  if (query.q) where.push(or(ilike(articles.title, likePattern(query.q)), ilike(articles.summary, likePattern(query.q)))!);
  return getDb()
    .select({ ...listColumns, status: articles.status })
    .from(articles)
    .innerJoin(categories, eq(articles.categoryId, categories.id))
    .where(where.length ? and(...where) : undefined)
    .orderBy(desc(articles.updatedAt))
    .limit(500);
}

export async function adminGetArticle(id: string) {
  const [row] = await getDb()
    .select({ article: articles, reviewerName: users.name })
    .from(articles)
    .leftJoin(users, eq(articles.reviewedById, users.id))
    .where(eq(articles.id, id))
    .limit(1);
  if (!row) throw notFound('Article not found');
  return { ...row.article, reviewerName: row.reviewerName };
}

export async function createArticle(dto: CreateArticle) {
  await assertCategory(dto.categoryId);
  const slug = await uniqueSlug(articles, dto.slug || dto.title);
  const [row] = await getDb()
    .insert(articles)
    .values({
      slug,
      audience: dto.audience,
      title: dto.title,
      summary: dto.summary,
      body: dto.body,
      membersOnly: dto.membersOnly ?? false,
      categoryId: dto.categoryId,
      tags: dto.tags ?? [],
      status: 'DRAFT',
    })
    .returning();
  return row;
}

export async function updateArticle(id: string, dto: UpdateArticle) {
  const current = await adminGetArticle(id);
  if (dto.categoryId) await assertCategory(dto.categoryId);

  const patch: Partial<Article> = {};
  for (const [key, value] of Object.entries(dto)) {
    if (value !== undefined) (patch as Record<string, unknown>)[key] = value;
  }
  if (dto.slug && dto.slug !== current.slug) patch.slug = await uniqueSlug(articles, dto.slug, id);

  const clinicalChange = CLINICAL_FIELDS.some((k) => dto[k] !== undefined && dto[k] !== current[k]);
  const reviewCleared = clinicalChange && !!current.reviewedAt;
  if (reviewCleared) {
    patch.reviewedAt = null;
    patch.reviewedById = null;
  }
  const [row] = await getDb().update(articles).set(patch).where(eq(articles.id, id)).returning();
  return { ...row, reviewCleared };
}

export async function setArticleStatus(id: string, status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED') {
  const current = await adminGetArticle(id);
  const [row] = await getDb()
    .update(articles)
    .set({ status, publishedAt: status === 'PUBLISHED' ? (current.publishedAt ?? new Date()) : current.publishedAt })
    .where(eq(articles.id, id))
    .returning();
  return row;
}

export async function markArticleReviewed(id: string, reviewerId: string) {
  await adminGetArticle(id);
  const [row] = await getDb()
    .update(articles)
    .set({ reviewedAt: new Date(), reviewedById: reviewerId })
    .where(eq(articles.id, id))
    .returning();
  return row;
}

export async function deleteArticle(id: string) {
  await adminGetArticle(id);
  await getDb().delete(articles).where(eq(articles.id, id));
}
