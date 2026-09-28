export type Audience = 'DENTIST' | 'PATIENT';
export type AudienceParam = 'dentist' | 'patient';
export type Role = 'ADMIN' | 'STAFF' | 'DENTIST';
export type ContentStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export const toAudience = (p?: string | null): Audience | undefined =>
  p === 'dentist' ? 'DENTIST' : p === 'patient' ? 'PATIENT' : undefined;
export const toParam = (a: Audience): AudienceParam => (a === 'DENTIST' ? 'dentist' : 'patient');

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  phone: string | null;
  city: string | null;
  registrationNo: string | null;
  isStudent: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sortOrder: number;
  faqCount: number;
}

export interface FaqListItem {
  id: string;
  slug: string;
  audience: Audience;
  question: string;
  summary: string;
  tags: string[];
  reviewedAt: string | null;
  updatedAt: string;
  category: { slug: string; name: string };
}

export interface FaqDetail extends Omit<FaqListItem, 'category'> {
  answer: string;
  references: string | null;
  publishedAt: string | null;
  createdAt: string;
  categoryId: string;
  category: { id: string; slug: string; name: string };
  reviewerName: string | null;
  related: FaqListItem[];
}

export interface ArticleListItem {
  id: string;
  slug: string;
  audience: Audience;
  title: string;
  summary: string;
  membersOnly: boolean;
  tags: string[];
  reviewedAt: string | null;
  publishedAt: string | null;
  updatedAt: string;
  category: { slug: string; name: string };
}

export interface ArticleDetail extends Omit<ArticleListItem, 'category'> {
  body: string | null;
  locked: boolean;
  category: { id: string; slug: string; name: string };
  reviewerName: string | null;
}

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ---- Admin ----

export interface AdminFaq {
  id: string;
  slug: string;
  audience: Audience;
  question: string;
  summary: string;
  answer: string;
  references: string | null;
  tags: string[];
  status: ContentStatus;
  categoryId: string;
  reviewedAt: string | null;
  reviewerName: string | null;
  viewCount: number;
  publishedAt: string | null;
  updatedAt: string;
}

export interface AdminFaqRow extends FaqListItem {
  status: ContentStatus;
  viewCount: number;
  publishedAt: string | null;
}

export interface AdminArticle {
  id: string;
  slug: string;
  audience: Audience;
  title: string;
  summary: string;
  body: string;
  membersOnly: boolean;
  tags: string[];
  status: ContentStatus;
  categoryId: string;
  reviewedAt: string | null;
  reviewerName: string | null;
  publishedAt: string | null;
  updatedAt: string;
}

export interface AdminArticleRow extends ArticleListItem {
  status: ContentStatus;
}

export interface Question {
  id: string;
  name: string;
  email: string;
  audience: Audience;
  question: string;
  status: 'NEW' | 'ANSWERED' | 'ARCHIVED';
  adminNote: string | null;
  faqId: string | null;
  createdAt: string;
}

export interface Enquiry {
  id: string;
  clinicName: string;
  contactName: string;
  email: string;
  phone: string;
  city: string;
  preferredDates: string | null;
  procedures: string | null;
  message: string | null;
  status: 'NEW' | 'CONTACTED' | 'CLOSED';
  adminNote: string | null;
  createdAt: string;
}

export interface Stats {
  faqs: { publishedDentist: number; publishedPatient: number; drafts: number; awaitingReview: number };
  articles: { published: number; awaitingReview: number };
  newQuestions: number;
  newEnquiries: number;
  members: { total: number; students: number };
}

export interface Member {
  id: string;
  name: string;
  email: string;
  city: string | null;
  phone: string | null;
  registrationNo: string | null;
  isStudent: boolean;
  createdAt: string;
}
