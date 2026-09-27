/**
 * End-to-end tests against a real Postgres database.
 * Set TEST_DATABASE_URL to an EMPTY database: every table in it is truncated before the run.
 */
import 'dotenv/config';
import 'reflect-metadata';
import path from 'node:path';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import bcrypt from 'bcryptjs';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import request from 'supertest';
import * as schema from '../src/db/schema';

const TEST_DB = process.env.TEST_DATABASE_URL;
if (!TEST_DB) throw new Error('Set TEST_DATABASE_URL to an empty database for the e2e tests');
process.env.DATABASE_URL = TEST_DB;
process.env.JWT_SECRET = 'test-secret-that-is-long-enough-for-tests-0123456789';

// Imported after the env is set, because config is read when the app module is created
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { AppModule } = require('../src/app.module');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { configureApp } = require('../src/setup');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { loadConfig } = require('../src/config');

describe('Perio API (e2e)', () => {
  let app: INestApplication;
  let pool: Pool;
  let categoryId: string;
  const agent = () => request(app.getHttpServer());

  async function login(email: string, password: string): Promise<string> {
    const res = await agent().post('/auth/login').send({ email, password }).expect(200);
    return res.body.token as string;
  }

  beforeAll(async () => {
    pool = new Pool({ connectionString: TEST_DB });
    const db = drizzle(pool, { schema });
    await migrate(db, { migrationsFolder: path.resolve(__dirname, '../drizzle') });
    await db.execute(
      sql`truncate table questions, clinic_enquiries, faqs, articles, categories, users restart identity cascade`,
    );
    const hash = await bcrypt.hash('admin-password-123', 4);
    await db.insert(schema.users).values([
      { email: 'admin@test.local', name: 'Dr Admin', passwordHash: hash, role: 'ADMIN' },
      { email: 'staff@test.local', name: 'Staff Member', passwordHash: hash, role: 'STAFF' },
    ]);
    const [cat] = await db
      .insert(schema.categories)
      .values({ slug: 'basics', name: 'Basics' })
      .returning();
    categoryId = cat.id;

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app, loadConfig());
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
    await pool?.end();
  });

  it('reports health', () => agent().get('/health').expect(200, { status: 'ok' }));

  describe('accounts', () => {
    it('registers a dentist and returns a session', async () => {
      const res = await agent()
        .post('/auth/register')
        .send({ name: 'Dr Dentist', email: 'Dentist@Test.local', password: 'password123' })
        .expect(201);
      expect(res.body.user).toMatchObject({ email: 'dentist@test.local', role: 'DENTIST' });
      expect(res.body.user.passwordHash).toBeUndefined();
      expect(res.headers['set-cookie'][0]).toMatch(/perio_session=.*HttpOnly/);
    });

    it('rejects a duplicate email', () =>
      agent()
        .post('/auth/register')
        .send({ name: 'Again', email: 'dentist@test.local', password: 'password123' })
        .expect(409));

    it('does not let sign-up choose a role', () =>
      agent()
        .post('/auth/register')
        .send({ name: 'Evil', email: 'evil@test.local', password: 'password123', role: 'ADMIN' })
        .expect(400));

    it('rejects a wrong password without saying which part was wrong', async () => {
      const res = await agent()
        .post('/auth/login')
        .send({ email: 'dentist@test.local', password: 'nope-nope' })
        .expect(401);
      expect(res.body.message).toBe('Email or password is incorrect');
    });

    it('keeps dentists out of the admin', async () => {
      const token = await login('dentist@test.local', 'password123');
      await agent().get('/admin/stats').set('Authorization', `Bearer ${token}`).expect(403);
      await agent().get('/admin/stats').expect(401);
    });

    it('refuses non-JSON writes (CSRF protection)', () =>
      agent().post('/questions').type('form').send('name=x').expect(415));
  });

  describe('FAQ publishing and clinical review', () => {
    let adminToken: string;
    let staffToken: string;
    let faqId: string;

    beforeAll(async () => {
      adminToken = await login('admin@test.local', 'admin-password-123');
      staffToken = await login('staff@test.local', 'admin-password-123');
    });

    it('lets staff create a draft that is not public', async () => {
      const res = await agent()
        .post('/admin/faqs')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          audience: 'PATIENT',
          categoryId,
          question: 'Why do my gums bleed?',
          summary: 'Usually inflammation from plaque.',
          answer: 'Bleeding gums are usually a sign of **gingivitis**.',
        })
        .expect(201);
      faqId = res.body.id;
      expect(res.body).toMatchObject({ status: 'DRAFT', slug: 'why-do-my-gums-bleed' });
      await agent().get('/faqs/why-do-my-gums-bleed').expect(404);
    });

    it('publishes and finds it by prefix search', async () => {
      await agent().post(`/admin/faqs/${faqId}/publish`).set('Authorization', `Bearer ${staffToken}`).expect(200);
      await agent().get('/faqs/why-do-my-gums-bleed').expect(200);
      const res = await agent().get('/search').query({ q: 'bleed gum', audience: 'PATIENT' }).expect(200);
      expect(res.body.faqs.map((f: { id: string }) => f.id)).toContain(faqId);
      const none = await agent().get('/search').query({ q: 'bleed', audience: 'DENTIST' }).expect(200);
      expect(none.body.faqs).toHaveLength(0);
    });

    it('only lets the specialist mark clinical review', async () => {
      await agent().post(`/admin/faqs/${faqId}/review`).set('Authorization', `Bearer ${staffToken}`).expect(403);
      const res = await agent().post(`/admin/faqs/${faqId}/review`).set('Authorization', `Bearer ${adminToken}`).expect(200);
      expect(res.body.reviewedAt).toBeTruthy();
      const pub = await agent().get('/faqs/why-do-my-gums-bleed').expect(200);
      expect(pub.body.reviewerName).toBe('Dr Admin');
    });

    it('keeps the review when only tags change', async () => {
      const res = await agent()
        .patch(`/admin/faqs/${faqId}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ tags: ['Bleeding', 'bleeding', ' gums '] })
        .expect(200);
      expect(res.body.reviewCleared).toBe(false);
      expect(res.body.reviewedAt).toBeTruthy();
      expect(res.body.tags).toEqual(['bleeding', 'gums']);
    });

    it('clears the review when the answer changes', async () => {
      const res = await agent()
        .patch(`/admin/faqs/${faqId}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ answer: 'A different answer that nobody has reviewed.' })
        .expect(200);
      expect(res.body.reviewCleared).toBe(true);
      expect(res.body.reviewedAt).toBeNull();
    });

    it('only lets the specialist delete', async () => {
      await agent().delete(`/admin/faqs/${faqId}`).set('Authorization', `Bearer ${staffToken}`).expect(403);
    });
  });

  describe('members-only articles', () => {
    beforeAll(async () => {
      const adminToken = await login('admin@test.local', 'admin-password-123');
      const res = await agent()
        .post('/admin/articles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          audience: 'DENTIST',
          categoryId,
          title: 'Save or extract checklist',
          summary: 'A checklist for compromised teeth.',
          body: 'Secret members-only checklist content here.',
          membersOnly: true,
        })
        .expect(201);
      await agent().post(`/admin/articles/${res.body.id}/publish`).set('Authorization', `Bearer ${adminToken}`).expect(200);
    });

    it('hides the body from visitors', async () => {
      const res = await agent().get('/articles/save-or-extract-checklist').expect(200);
      expect(res.body).toMatchObject({ locked: true, body: null });
    });

    it('shows the body to signed-in dentists', async () => {
      const token = await login('dentist@test.local', 'password123');
      const res = await agent()
        .get('/articles/save-or-extract-checklist')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(res.body.locked).toBe(false);
      expect(res.body.body).toContain('Secret members-only');
    });
  });

  describe('public forms', () => {
    it('stores a question and drops honeypot submissions', async () => {
      await agent()
        .post('/questions')
        .send({ name: 'Ravi', email: 'ravi@test.local', audience: 'PATIENT', question: 'Does scaling loosen teeth?' })
        .expect(202);
      await agent()
        .post('/questions')
        .send({ name: 'Bot', email: 'bot@test.local', audience: 'PATIENT', question: 'Buy cheap pills now', website: 'x' })
        .expect(202);
      const token = await login('admin@test.local', 'admin-password-123');
      const res = await agent().get('/admin/questions').set('Authorization', `Bearer ${token}`).expect(200);
      expect(res.body.map((q: { name: string }) => q.name)).toEqual(['Ravi']);
    });

    it('validates clinic enquiries', async () => {
      const res = await agent().post('/enquiries').send({ clinicName: 'X' }).expect(400);
      expect(Object.keys(res.body.fields)).toEqual(
        expect.arrayContaining(['clinicName', 'contactName', 'email', 'phone', 'city']),
      );
    });
  });
});
