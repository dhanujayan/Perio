import { desc, eq, sql } from 'drizzle-orm';
import type { z } from 'zod';
import { getDb } from '../db';
import { notFound } from '../http';
import { articles, clinicEnquiries, faqs, questions, users } from '../schema';
import type {
  askSchema,
  enquiryFilter,
  enquirySchema,
  questionFilter,
  updateEnquirySchema,
  updateQuestionSchema,
} from '../validation';
import { createFaq } from './faqs';

// ---------- Public submissions ----------

export async function submitQuestion(dto: z.infer<typeof askSchema>) {
  if (dto.website) return; // honeypot filled in: accept silently, store nothing
  await getDb().insert(questions).values({
    name: dto.name,
    email: dto.email,
    audience: dto.audience,
    question: dto.question,
  });
}

export async function submitEnquiry(dto: z.infer<typeof enquirySchema>) {
  if (dto.website) return;
  await getDb().insert(clinicEnquiries).values({
    clinicName: dto.clinicName,
    contactName: dto.contactName,
    email: dto.email,
    phone: dto.phone,
    city: dto.city,
    preferredDates: dto.preferredDates ?? null,
    procedures: dto.procedures ?? null,
    message: dto.message ?? null,
  });
}

// ---------- Questions ----------

export function listQuestions(filter: z.infer<typeof questionFilter>) {
  return getDb()
    .select()
    .from(questions)
    .where(filter.status ? eq(questions.status, filter.status) : undefined)
    .orderBy(desc(questions.createdAt))
    .limit(500);
}

export async function updateQuestion(id: string, dto: z.infer<typeof updateQuestionSchema>) {
  const [row] = await getDb()
    .update(questions)
    .set({
      ...(dto.status !== undefined && { status: dto.status }),
      ...(dto.adminNote !== undefined && { adminNote: dto.adminNote }),
      ...(dto.faqId !== undefined && { faqId: dto.faqId }),
    })
    .where(eq(questions.id, id))
    .returning();
  if (!row) throw notFound('Question not found');
  return row;
}

/** Starts a draft FAQ from a submitted question and links the two. */
export async function draftFaqFromQuestion(id: string, categoryId: string) {
  const db = getDb();
  const [q] = await db.select().from(questions).where(eq(questions.id, id)).limit(1);
  if (!q) throw notFound('Question not found');
  const faq = await createFaq({
    audience: q.audience,
    question: q.question.slice(0, 300).padEnd(5, '?'),
    summary: 'Draft: write a one or two sentence answer here.',
    answer: '_Draft: write the full answer here._',
    categoryId,
  });
  await db.update(questions).set({ faqId: faq.id }).where(eq(questions.id, id));
  return faq;
}

// ---------- Clinic enquiries ----------

export function listEnquiries(filter: z.infer<typeof enquiryFilter>) {
  return getDb()
    .select()
    .from(clinicEnquiries)
    .where(filter.status ? eq(clinicEnquiries.status, filter.status) : undefined)
    .orderBy(desc(clinicEnquiries.createdAt))
    .limit(500);
}

export async function updateEnquiry(id: string, dto: z.infer<typeof updateEnquirySchema>) {
  const [row] = await getDb()
    .update(clinicEnquiries)
    .set({
      ...(dto.status !== undefined && { status: dto.status }),
      ...(dto.adminNote !== undefined && { adminNote: dto.adminNote }),
    })
    .where(eq(clinicEnquiries.id, id))
    .returning();
  if (!row) throw notFound('Enquiry not found');
  return row;
}

// ---------- Dashboard ----------

export async function adminStats() {
  const db = getDb();
  const count = sql<number>`count(*)::int`;
  const [[faqStats], [articleStats], [q], [e], [members]] = await Promise.all([
    db
      .select({
        publishedDentist: sql<number>`count(*) filter (where ${faqs.status} = 'PUBLISHED' and ${faqs.audience} = 'DENTIST')::int`,
        publishedPatient: sql<number>`count(*) filter (where ${faqs.status} = 'PUBLISHED' and ${faqs.audience} = 'PATIENT')::int`,
        drafts: sql<number>`count(*) filter (where ${faqs.status} = 'DRAFT')::int`,
        awaitingReview: sql<number>`count(*) filter (where ${faqs.status} <> 'ARCHIVED' and ${faqs.reviewedAt} is null)::int`,
      })
      .from(faqs),
    db
      .select({
        published: sql<number>`count(*) filter (where ${articles.status} = 'PUBLISHED')::int`,
        awaitingReview: sql<number>`count(*) filter (where ${articles.status} <> 'ARCHIVED' and ${articles.reviewedAt} is null)::int`,
      })
      .from(articles),
    db.select({ n: count }).from(questions).where(eq(questions.status, 'NEW')),
    db.select({ n: count }).from(clinicEnquiries).where(eq(clinicEnquiries.status, 'NEW')),
    db
      .select({ total: count, students: sql<number>`count(*) filter (where ${users.isStudent})::int` })
      .from(users)
      .where(eq(users.role, 'DENTIST')),
  ]);
  return { faqs: faqStats, articles: articleStats, newQuestions: q.n, newEnquiries: e.n, members };
}

export async function listMembers(page: { page: number; pageSize: number }) {
  const db = getDb();
  const where = eq(users.role, 'DENTIST');
  const [items, [{ total }]] = await Promise.all([
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        city: users.city,
        phone: users.phone,
        registrationNo: users.registrationNo,
        isStudent: users.isStudent,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(where)
      .orderBy(desc(users.createdAt))
      .limit(page.pageSize)
      .offset((page.page - 1) * page.pageSize),
    db.select({ total: sql<number>`count(*)::int` }).from(users).where(where),
  ]);
  return { items, total, page: page.page, pageSize: page.pageSize };
}
