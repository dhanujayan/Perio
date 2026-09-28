import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', [
  'ADMIN', // the specialist: publishes and clinically reviews content
  'STAFF', // assistant: manages inbox and drafts, cannot mark clinical review
  'DENTIST', // registered dentist or student: members-only content
]);
export const audienceEnum = pgEnum('audience', ['DENTIST', 'PATIENT']);
export const contentStatusEnum = pgEnum('content_status', ['DRAFT', 'PUBLISHED', 'ARCHIVED']);
export const questionStatusEnum = pgEnum('question_status', ['NEW', 'ANSWERED', 'ARCHIVED']);
export const enquiryStatusEnum = pgEnum('enquiry_status', ['NEW', 'CONTACTED', 'CLOSED']);

export type Role = (typeof roleEnum.enumValues)[number];
export type Audience = (typeof audienceEnum.enumValues)[number];
export type ContentStatus = (typeof contentStatusEnum.enumValues)[number];
export type QuestionStatus = (typeof questionStatusEnum.enumValues)[number];
export type EnquiryStatus = (typeof enquiryStatusEnum.enumValues)[number];

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  role: roleEnum('role').notNull().default('DENTIST'),
  phone: text('phone'),
  city: text('city'),
  // Dental council registration number, or college name for students
  registrationNo: text('registration_no'),
  isStudent: boolean('is_student').notNull().default(false),
  ...timestamps,
});

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const faqs = pgTable(
  'faqs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull().unique(),
    audience: audienceEnum('audience').notNull(),
    question: text('question').notNull(),
    // Markdown
    answer: text('answer').notNull(),
    // Short plain-text answer for search snippets and FAQ structured data
    summary: text('summary').notNull(),
    // Markdown list of references (dentist answers)
    references: text('references'),
    tags: text('tags').array().notNull().default(sql`'{}'::text[]`),
    status: contentStatusEnum('status').notNull().default('DRAFT'),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id),
    // Clinical review: only an ADMIN can set this
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    reviewedById: uuid('reviewed_by_id').references(() => users.id, { onDelete: 'set null' }),
    viewCount: integer('view_count').notNull().default(0),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index('faqs_audience_status_idx').on(t.audience, t.status),
    index('faqs_category_idx').on(t.categoryId),
    index('faqs_search_idx').using(
      'gin',
      sql`to_tsvector('english', ${t.question} || ' ' || ${t.summary} || ' ' || ${t.answer})`,
    ),
  ],
);

export const articles = pgTable(
  'articles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull().unique(),
    audience: audienceEnum('audience').notNull(),
    title: text('title').notNull(),
    summary: text('summary').notNull(),
    // Markdown
    body: text('body').notNull(),
    // Deeper case-based content visible only to signed-in dentists
    membersOnly: boolean('members_only').notNull().default(false),
    tags: text('tags').array().notNull().default(sql`'{}'::text[]`),
    status: contentStatusEnum('status').notNull().default('DRAFT'),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    reviewedById: uuid('reviewed_by_id').references(() => users.id, { onDelete: 'set null' }),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index('articles_audience_status_idx').on(t.audience, t.status),
    index('articles_search_idx').using(
      'gin',
      sql`to_tsvector('english', ${t.title} || ' ' || ${t.summary} || ' ' || ${t.body})`,
    ),
  ],
);

// "Ask a question" submissions from the public site
export const questions = pgTable(
  'questions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    audience: audienceEnum('audience').notNull(),
    question: text('question').notNull(),
    status: questionStatusEnum('status').notNull().default('NEW'),
    adminNote: text('admin_note'),
    faqId: uuid('faq_id').references(() => faqs.id, { onDelete: 'set null' }),
    ...timestamps,
  },
  (t) => [index('questions_status_idx').on(t.status, t.createdAt)],
);

// v1 clinic enquiry form; replaced by full online booking in v3
export const clinicEnquiries = pgTable(
  'clinic_enquiries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clinicName: text('clinic_name').notNull(),
    contactName: text('contact_name').notNull(),
    email: text('email').notNull(),
    phone: text('phone').notNull(),
    city: text('city').notNull(),
    preferredDates: text('preferred_dates'),
    procedures: text('procedures'),
    message: text('message'),
    status: enquiryStatusEnum('status').notNull().default('NEW'),
    adminNote: text('admin_note'),
    ...timestamps,
  },
  (t) => [index('clinic_enquiries_status_idx').on(t.status, t.createdAt)],
);

// Fixed-window request counters for sign-in and public forms. Kept in the database because
// serverless functions do not share memory between instances.
export const rateLimits = pgTable('rate_limits', {
  key: text('key').primaryKey(), // e.g. "login:203.0.113.5:2026-09-28T06:14"
  count: integer('count').notNull().default(0),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
});

export type User = typeof users.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Faq = typeof faqs.$inferSelect;
export type Article = typeof articles.$inferSelect;
export type Question = typeof questions.$inferSelect;
export type ClinicEnquiry = typeof clinicEnquiries.$inferSelect;
