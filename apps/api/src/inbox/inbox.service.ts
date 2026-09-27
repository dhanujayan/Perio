import { Injectable, NotFoundException } from '@nestjs/common';
import { desc, eq, sql } from 'drizzle-orm';
import { InjectDb, type Database } from '../db/db.module';
import { articles, clinicEnquiries, faqs, questions, users } from '../db/schema';
import { FaqService } from '../content/faq.service';
import { PageQuery, Paged } from '../common/util';
import {
  AskQuestionDto,
  ClinicEnquiryDto,
  DraftFaqFromQuestionDto,
  EnquiryFilter,
  QuestionFilter,
  UpdateEnquiryDto,
  UpdateQuestionDto,
} from './inbox.dto';

@Injectable()
export class InboxService {
  constructor(
    @InjectDb() private readonly db: Database,
    private readonly faqService: FaqService,
  ) {}

  // ----- Public submissions -----

  async ask(dto: AskQuestionDto) {
    if (dto.website) return; // honeypot tripped: accept silently, store nothing
    await this.db.insert(questions).values({
      name: dto.name,
      email: dto.email,
      audience: dto.audience,
      question: dto.question,
    });
  }

  async enquire(dto: ClinicEnquiryDto) {
    if (dto.website) return;
    await this.db.insert(clinicEnquiries).values({
      clinicName: dto.clinicName,
      contactName: dto.contactName,
      email: dto.email,
      phone: dto.phone,
      city: dto.city,
      preferredDates: dto.preferredDates || null,
      procedures: dto.procedures || null,
      message: dto.message || null,
    });
  }

  // ----- Questions -----

  listQuestions(filter: QuestionFilter) {
    return this.db
      .select()
      .from(questions)
      .where(filter.status ? eq(questions.status, filter.status) : undefined)
      .orderBy(desc(questions.createdAt))
      .limit(500);
  }

  async updateQuestion(id: string, dto: UpdateQuestionDto) {
    const [row] = await this.db
      .update(questions)
      .set({
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.adminNote !== undefined && { adminNote: dto.adminNote }),
        ...(dto.faqId !== undefined && { faqId: dto.faqId }),
      })
      .where(eq(questions.id, id))
      .returning();
    if (!row) throw new NotFoundException('Question not found');
    return row;
  }

  /** Starts a draft FAQ from a submitted question and links the two. */
  async draftFaq(id: string, dto: DraftFaqFromQuestionDto) {
    const [q] = await this.db.select().from(questions).where(eq(questions.id, id)).limit(1);
    if (!q) throw new NotFoundException('Question not found');
    const faq = await this.faqService.create({
      audience: q.audience,
      question: q.question.slice(0, 300).padEnd(5, '?'),
      summary: 'Draft: write a one or two sentence answer here.',
      answer: '_Draft: write the full answer here._',
      categoryId: dto.categoryId,
    });
    await this.db.update(questions).set({ faqId: faq.id }).where(eq(questions.id, id));
    return faq;
  }

  // ----- Clinic enquiries -----

  listEnquiries(filter: EnquiryFilter) {
    return this.db
      .select()
      .from(clinicEnquiries)
      .where(filter.status ? eq(clinicEnquiries.status, filter.status) : undefined)
      .orderBy(desc(clinicEnquiries.createdAt))
      .limit(500);
  }

  async updateEnquiry(id: string, dto: UpdateEnquiryDto) {
    const [row] = await this.db
      .update(clinicEnquiries)
      .set({
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.adminNote !== undefined && { adminNote: dto.adminNote }),
      })
      .where(eq(clinicEnquiries.id, id))
      .returning();
    if (!row) throw new NotFoundException('Enquiry not found');
    return row;
  }

  // ----- Dashboard -----

  async stats() {
    const count = sql<number>`count(*)::int`;
    const [[faqStats], [articleStats], [q], [e], [members]] = await Promise.all([
      this.db
        .select({
          publishedDentist: sql<number>`count(*) filter (where ${faqs.status} = 'PUBLISHED' and ${faqs.audience} = 'DENTIST')::int`,
          publishedPatient: sql<number>`count(*) filter (where ${faqs.status} = 'PUBLISHED' and ${faqs.audience} = 'PATIENT')::int`,
          drafts: sql<number>`count(*) filter (where ${faqs.status} = 'DRAFT')::int`,
          awaitingReview: sql<number>`count(*) filter (where ${faqs.status} <> 'ARCHIVED' and ${faqs.reviewedAt} is null)::int`,
        })
        .from(faqs),
      this.db
        .select({
          published: sql<number>`count(*) filter (where ${articles.status} = 'PUBLISHED')::int`,
          awaitingReview: sql<number>`count(*) filter (where ${articles.status} <> 'ARCHIVED' and ${articles.reviewedAt} is null)::int`,
        })
        .from(articles),
      this.db.select({ n: count }).from(questions).where(eq(questions.status, 'NEW')),
      this.db.select({ n: count }).from(clinicEnquiries).where(eq(clinicEnquiries.status, 'NEW')),
      this.db
        .select({
          total: count,
          students: sql<number>`count(*) filter (where ${users.isStudent})::int`,
        })
        .from(users)
        .where(eq(users.role, 'DENTIST')),
    ]);
    return {
      faqs: faqStats,
      articles: articleStats,
      newQuestions: q.n,
      newEnquiries: e.n,
      members,
    };
  }

  async listMembers(page: PageQuery): Promise<Paged<unknown>> {
    const where = eq(users.role, 'DENTIST');
    const [items, [{ total }]] = await Promise.all([
      this.db
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
      this.db.select({ total: sql<number>`count(*)::int` }).from(users).where(where),
    ]);
    return { items, total, page: page.page, pageSize: page.pageSize };
  }
}
