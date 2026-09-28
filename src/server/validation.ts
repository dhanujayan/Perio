import { z } from 'zod';

// ---------- Building blocks ----------

const text = (min: number, max: number, label: string) =>
  z
    .string({ error: `${label} is required` })
    .trim()
    .min(min, min <= 1 ? `${label} is required` : `${label} must be at least ${min} characters`)
    .max(max, `${label} must be at most ${max} characters`);

const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} must be at most ${max} characters`)
    .optional()
    .transform((v) => (v ? v : undefined));

const email = z
  .string({ error: 'Email is required' })
  .trim()
  .toLowerCase()
  .max(200)
  .pipe(z.email('Enter a valid email address'));

const slug = z
  .string()
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and hyphens only');

const tags = z
  .array(z.string().max(40, 'Tags must be at most 40 characters'))
  .max(12, 'At most 12 tags')
  .transform((list) => [...new Set(list.map((t) => t.trim().toLowerCase()).filter(Boolean))]);

export const audience = z.enum(['DENTIST', 'PATIENT'], { error: 'Choose patients or dentists' });
const contentStatus = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']);
const uuid = z.uuid('Invalid id');

// Query-string numbers arrive as text
const intParam = (min: number, max: number, fallback: number) =>
  z.coerce.number().int().min(min).max(max).catch(fallback).default(fallback);

// ---------- Accounts ----------

export const registerSchema = z.strictObject({
  name: text(2, 120, 'Name'),
  email,
  password: z.string().min(8, 'Password must be at least 8 characters').max(200),
  isStudent: z.boolean().optional(),
  registrationNo: optionalText(120, 'Registration number'),
  city: optionalText(80, 'City'),
  phone: optionalText(30, 'Phone'),
});

export const loginSchema = z.strictObject({
  email,
  password: z.string().min(1, 'Password is required').max(200),
});

export const setupSchema = z.strictObject({
  token: z.string().min(1, 'Setup code is required').max(500),
  name: text(2, 120, 'Name'),
  email,
  password: z.string().min(10, 'Password must be at least 10 characters').max(200),
});

// ---------- Content ----------

export const listQuery = z.object({
  audience: audience.optional(),
  category: z.string().max(80).optional(),
  q: z.string().max(200).optional(),
  page: intParam(1, 10_000, 1),
  pageSize: intParam(1, 100, 20),
});
export type ListQuery = z.infer<typeof listQuery>;

export const searchQuery = z.object({
  q: z.string().max(200).default(''),
  audience: audience.optional(),
});

export const audienceQuery = z.object({ audience: audience.optional() });

export const adminContentQuery = z.object({
  status: contentStatus.optional(),
  audience: audience.optional(),
  reviewed: z.enum(['true', 'false']).optional(),
  q: z.string().max(200).optional(),
});
export type AdminContentQuery = z.infer<typeof adminContentQuery>;

export const createFaqSchema = z.strictObject({
  audience,
  question: text(5, 300, 'Question'),
  summary: text(10, 400, 'Short answer'),
  answer: z.string().min(10, 'Answer must be at least 10 characters').max(20_000),
  references: z.string().max(5000).nullish(),
  categoryId: uuid,
  tags: tags.optional(),
  slug: slug.optional(),
});
export const updateFaqSchema = createFaqSchema.partial();
export type CreateFaq = z.infer<typeof createFaqSchema>;
export type UpdateFaq = z.infer<typeof updateFaqSchema>;

export const createArticleSchema = z.strictObject({
  audience,
  title: text(5, 200, 'Title'),
  summary: text(10, 400, 'Summary'),
  body: z.string().min(20, 'Body must be at least 20 characters').max(100_000),
  membersOnly: z.boolean().optional(),
  categoryId: uuid,
  tags: tags.optional(),
  slug: slug.optional(),
});
export const updateArticleSchema = createArticleSchema.partial();
export type CreateArticle = z.infer<typeof createArticleSchema>;
export type UpdateArticle = z.infer<typeof updateArticleSchema>;

export const categorySchema = z.strictObject({
  name: text(2, 80, 'Name'),
  description: z.string().max(300).optional(),
  slug: slug.optional(),
  sortOrder: z.number().int().optional(),
});

// ---------- Public forms ----------

/** Hidden field that people never fill in; bots usually do. */
const honeypot = z.string().max(200).optional();

export const askSchema = z.strictObject({
  name: text(2, 120, 'Name'),
  email,
  audience,
  question: text(10, 2000, 'Question'),
  website: honeypot,
});

export const enquirySchema = z.strictObject({
  clinicName: text(2, 160, 'Clinic name'),
  contactName: text(2, 120, 'Contact person'),
  email,
  phone: text(6, 30, 'Phone'),
  city: text(2, 80, 'City'),
  preferredDates: optionalText(300, 'Preferred dates'),
  procedures: optionalText(1000, 'Procedures'),
  message: optionalText(3000, 'Message'),
  website: honeypot,
});

// ---------- Admin inbox ----------

export const questionFilter = z.object({ status: z.enum(['NEW', 'ANSWERED', 'ARCHIVED']).optional() });
export const updateQuestionSchema = z.strictObject({
  status: z.enum(['NEW', 'ANSWERED', 'ARCHIVED']).optional(),
  adminNote: z.string().max(2000).optional(),
  faqId: uuid.nullish(),
});
export const draftFaqSchema = z.strictObject({ categoryId: uuid });

export const enquiryFilter = z.object({ status: z.enum(['NEW', 'CONTACTED', 'CLOSED']).optional() });
export const updateEnquirySchema = z.strictObject({
  status: z.enum(['NEW', 'CONTACTED', 'CLOSED']).optional(),
  adminNote: z.string().max(2000).optional(),
});

export const pageQuery = z.object({ page: intParam(1, 10_000, 1), pageSize: intParam(1, 100, 20) });
