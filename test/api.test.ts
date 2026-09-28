/**
 * End-to-end API tests: builds nothing, but starts `next start` (run `npm run build` first) against
 * TEST_DATABASE_URL and calls the real HTTP endpoints.
 *
 * TEST_DATABASE_URL must point at an EMPTY database: it is wiped before the run.
 */
import { config } from 'dotenv';
import assert from 'node:assert/strict';
import { spawn, type ChildProcess } from 'node:child_process';
import { after, before, describe, it } from 'node:test';
import { Pool } from 'pg';

config({ path: ['.env.local', '.env'], quiet: true });

const TEST_DB = process.env.TEST_DATABASE_URL;
if (!TEST_DB) throw new Error('Set TEST_DATABASE_URL to an empty database');
const PORT = 3109;
const BASE = `http://localhost:${PORT}/api`;
const JWT = 'test-secret-that-is-long-enough-for-tests-0123456789';
const SETUP = 'test-setup-code-abcdef';

let server: ChildProcess;
let pool: Pool;
let categoryId: string;

type Res = { status: number; body: any; headers: Headers };

async function call(method: string, path: string, opts: { body?: unknown; token?: string; raw?: string; type?: string } = {}): Promise<Res> {
  const headers: Record<string, string> = {};
  if (opts.token) headers.authorization = `Bearer ${opts.token}`;
  let body: string | undefined;
  if (opts.raw !== undefined) {
    body = opts.raw;
    headers['content-type'] = opts.type ?? 'text/plain';
  } else if (opts.body !== undefined) {
    body = JSON.stringify(opts.body);
    headers['content-type'] = 'application/json';
  }
  const res = await fetch(`${BASE}${path}`, { method, headers, body });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null, headers: res.headers };
}

async function login(email: string, password: string) {
  const res = await call('POST', '/auth/login', { body: { email, password } });
  assert.equal(res.status, 200, JSON.stringify(res.body));
  return res.body.token as string;
}

before(async () => {
  pool = new Pool({ connectionString: TEST_DB });
  await pool.query('drop schema if exists public cascade; drop schema if exists drizzle cascade; create schema public;');
  const { runMigrations } = await import('../scripts/migrate');
  await runMigrations(TEST_DB);
  // Start from empty content tables (the migrations load the starter content)
  await pool.query('truncate questions, clinic_enquiries, faqs, articles, categories, users, rate_limits cascade');
  const { rows } = await pool.query(`insert into categories (slug, name) values ('basics', 'Basics') returning id`);
  categoryId = rows[0].id;

  server = spawn(process.execPath, [require.resolve('next/dist/bin/next'), 'start', '--port', String(PORT)], {
    env: { ...process.env, DATABASE_URL: TEST_DB, JWT_SECRET: JWT, SETUP_TOKEN: SETUP, NETLIFY_DB_URL: '' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  server.stderr?.on('data', (d) => process.stderr.write(d));
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`${BASE}/health`);
      if (r.ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('Server did not start');
});

after(async () => {
  server?.kill();
  await pool?.end();
  // The pool opened by services called directly from this process
  await (globalThis as { perioPool?: Pool }).perioPool?.end();
});

describe('first-run setup', () => {
  it('rejects a wrong setup code', async () => {
    const res = await call('POST', '/auth/setup', { body: { token: 'wrong-code-xyz', name: 'Dr Admin', email: 'admin@test.local', password: 'admin-password-123' } });
    assert.equal(res.status, 403);
  });

  it('creates the first admin with the right code', async () => {
    const res = await call('POST', '/auth/setup', { body: { token: SETUP, name: 'Dr Admin', email: 'admin@test.local', password: 'admin-password-123' } });
    assert.equal(res.status, 201, JSON.stringify(res.body));
    assert.equal(res.body.user.role, 'ADMIN');
  });

  it('closes once an admin exists', async () => {
    const res = await call('POST', '/auth/setup', { body: { token: SETUP, name: 'Second', email: 'second@test.local', password: 'admin-password-123' } });
    assert.equal(res.status, 403);
  });
});

describe('accounts', () => {
  it('registers a dentist and sets a secure-flag-ready session cookie', async () => {
    const res = await call('POST', '/auth/register', { body: { name: 'Dr Dentist', email: 'Dentist@Test.local', password: 'password123' } });
    assert.equal(res.status, 201, JSON.stringify(res.body));
    assert.equal(res.body.user.email, 'dentist@test.local');
    assert.equal(res.body.user.role, 'DENTIST');
    assert.equal(res.body.user.passwordHash, undefined);
    assert.match(res.headers.get('set-cookie') ?? '', /perio_session=.*HttpOnly.*SameSite=Lax/);
  });

  it('rejects a duplicate email', async () => {
    const res = await call('POST', '/auth/register', { body: { name: 'Again', email: 'dentist@test.local', password: 'password123' } });
    assert.equal(res.status, 409);
  });

  it('does not let sign-up choose a role', async () => {
    const res = await call('POST', '/auth/register', { body: { name: 'Evil', email: 'evil@test.local', password: 'password123', role: 'ADMIN' } });
    assert.equal(res.status, 400);
    assert.ok(res.body.fields.role);
  });

  it('gives field errors for bad input', async () => {
    const res = await call('POST', '/auth/register', { body: { name: 'X', email: 'nope', password: '1' } });
    assert.equal(res.status, 400);
    assert.deepEqual(Object.keys(res.body.fields).sort(), ['email', 'name', 'password']);
  });

  it('rejects a wrong password without saying which part was wrong', async () => {
    const res = await call('POST', '/auth/login', { body: { email: 'dentist@test.local', password: 'nope-nope' } });
    assert.equal(res.status, 401);
    assert.equal(res.body.message, 'Email or password is incorrect');
  });

  it('keeps dentists and visitors out of the admin', async () => {
    const token = await login('dentist@test.local', 'password123');
    assert.equal((await call('GET', '/admin/stats', { token })).status, 403);
    assert.equal((await call('GET', '/admin/stats')).status, 401);
  });

  it('refuses non-JSON writes (CSRF protection)', async () => {
    const res = await call('POST', '/questions', { raw: 'name=x', type: 'application/x-www-form-urlencoded' });
    assert.equal(res.status, 415);
  });
});

describe('FAQ publishing and clinical review', () => {
  let admin: string;
  let staff: string;
  let faqId: string;

  before(async () => {
    admin = await login('admin@test.local', 'admin-password-123');
    const { createUser } = await import('../src/server/services/accounts');
    process.env.DATABASE_URL = TEST_DB;
    process.env.JWT_SECRET = JWT;
    await createUser({ email: 'staff@test.local', name: 'Staff Member', password: 'staff-password-123', role: 'STAFF' });
    staff = await login('staff@test.local', 'staff-password-123');
  });

  it('lets staff create a draft that is not public', async () => {
    const res = await call('POST', '/admin/faqs', {
      token: staff,
      body: { audience: 'PATIENT', categoryId, question: 'Why do my gums bleed?', summary: 'Usually inflammation from plaque.', answer: 'Bleeding gums are usually a sign of **gingivitis**.' },
    });
    assert.equal(res.status, 201, JSON.stringify(res.body));
    faqId = res.body.id;
    assert.equal(res.body.status, 'DRAFT');
    assert.equal(res.body.slug, 'why-do-my-gums-bleed');
    assert.equal((await call('GET', '/faqs/why-do-my-gums-bleed')).status, 404);
  });

  it('publishes and finds it by prefix search, only for its audience', async () => {
    assert.equal((await call('POST', `/admin/faqs/${faqId}/publish`, { token: staff })).status, 200);
    assert.equal((await call('GET', '/faqs/why-do-my-gums-bleed')).status, 200);
    const hit = await call('GET', '/search?q=bleed%20gum&audience=PATIENT');
    assert.ok(hit.body.faqs.some((f: { id: string }) => f.id === faqId));
    const miss = await call('GET', '/search?q=bleed&audience=DENTIST');
    assert.equal(miss.body.faqs.length, 0);
  });

  it('only lets the specialist mark clinical review', async () => {
    assert.equal((await call('POST', `/admin/faqs/${faqId}/review`, { token: staff })).status, 403);
    const res = await call('POST', `/admin/faqs/${faqId}/review`, { token: admin });
    assert.equal(res.status, 200);
    assert.ok(res.body.reviewedAt);
    const pub = await call('GET', '/faqs/why-do-my-gums-bleed');
    assert.equal(pub.body.reviewerName, 'Dr Admin');
  });

  it('keeps the review when only tags change', async () => {
    const res = await call('PATCH', `/admin/faqs/${faqId}`, { token: staff, body: { tags: ['Bleeding', 'bleeding', ' gums '] } });
    assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.equal(res.body.reviewCleared, false);
    assert.ok(res.body.reviewedAt);
    assert.deepEqual(res.body.tags, ['bleeding', 'gums']);
  });

  it('clears the review when the answer changes', async () => {
    const res = await call('PATCH', `/admin/faqs/${faqId}`, { token: staff, body: { answer: 'A different answer that nobody has reviewed.' } });
    assert.equal(res.body.reviewCleared, true);
    assert.equal(res.body.reviewedAt, null);
  });

  it('only lets the specialist delete', async () => {
    assert.equal((await call('DELETE', `/admin/faqs/${faqId}`, { token: staff })).status, 403);
  });

  it('rejects malformed ids', async () => {
    assert.equal((await call('GET', '/admin/faqs/not-a-uuid', { token: staff })).status, 400);
  });
});

describe('members-only articles', () => {
  before(async () => {
    const admin = await login('admin@test.local', 'admin-password-123');
    const res = await call('POST', '/admin/articles', {
      token: admin,
      body: { audience: 'DENTIST', categoryId, title: 'Save or extract checklist', summary: 'A checklist for compromised teeth.', body: 'Secret members-only checklist content here.', membersOnly: true },
    });
    assert.equal(res.status, 201, JSON.stringify(res.body));
    await call('POST', `/admin/articles/${res.body.id}/publish`, { token: admin });
  });

  it('hides the body from visitors', async () => {
    const res = await call('GET', '/articles/save-or-extract-checklist');
    assert.equal(res.body.locked, true);
    assert.equal(res.body.body, null);
  });

  it('shows the body to signed-in dentists', async () => {
    const token = await login('dentist@test.local', 'password123');
    const res = await call('GET', '/articles/save-or-extract-checklist', { token });
    assert.equal(res.body.locked, false);
    assert.match(res.body.body, /Secret members-only/);
  });
});

describe('public forms', () => {
  it('stores a question and drops honeypot submissions', async () => {
    assert.equal((await call('POST', '/questions', { body: { name: 'Ravi', email: 'ravi@test.local', audience: 'PATIENT', question: 'Does scaling loosen teeth?' } })).status, 202);
    assert.equal((await call('POST', '/questions', { body: { name: 'Bot', email: 'bot@test.local', audience: 'PATIENT', question: 'Buy cheap pills now', website: 'x' } })).status, 202);
    const admin = await login('admin@test.local', 'admin-password-123');
    const res = await call('GET', '/admin/questions', { token: admin });
    assert.deepEqual(res.body.map((q: { name: string }) => q.name), ['Ravi']);
  });

  it('validates clinic enquiries', async () => {
    const res = await call('POST', '/enquiries', { body: { clinicName: 'X' } });
    assert.equal(res.status, 400);
    for (const k of ['clinicName', 'contactName', 'email', 'phone', 'city']) assert.ok(res.body.fields[k], k);
  });

  it('rate-limits repeated form posts', async () => {
    let last = 0;
    for (let i = 0; i < 6; i++) {
      last = (await call('POST', '/enquiries', { body: { clinicName: 'X' } })).status;
    }
    assert.equal(last, 429);
  });
});
