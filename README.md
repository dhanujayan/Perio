# Perio Knowledge Hub — v1

The first version of the periodontal knowledge and education platform: a public knowledge hub with separate tracks for **patients** and **dentists**, a question inbox, a clinic enquiry form, free dentist accounts with members-only content, and an admin console with clinical review.

"Perio Knowledge Hub" is a placeholder name. Everything brand-specific is in `apps/web/src/site.config.ts`.

## What's in v1

**Public site**

- Home page with a patient/dentist switch, search and most-read questions
- FAQ library by audience and topic, with full-text prefix search ("bleed gum" finds "bleeding gums")
- FAQ pages with short answer, full answer (Markdown, tables), references, related questions and FAQ structured data for Google
- Every answer shows **"Clinically reviewed by … on …"** or **"Awaiting clinical review"**
- Articles, including members-only articles for signed-in dentists
- Ask a question, clinic enquiry ("book a visiting periodontist"), About, Privacy (draft)
- Sitemap, robots.txt, canonical URLs, mobile layout

**Accounts**

- Free dentist / student sign-up (public sign-up can only ever create the `DENTIST` role)
- Roles: `ADMIN` (the specialist), `STAFF` (assistant), `DENTIST`

**Admin console** (`/admin`)

- Overview: items awaiting review, new questions, new enquiries, library and member counts
- FAQ and article editor with Markdown preview, publish/unpublish, delete
- **Clinical review**: only `ADMIN` can mark content reviewed. Editing the question, summary, answer, references or audience automatically clears the review; tags, topic and web address do not
- Question inbox: status, private notes, and "Start FAQ draft" to turn a question into a draft FAQ
- Clinic enquiry inbox with status and notes
- Member list (`ADMIN` only)

## Stack

| Part | Choice |
| --- | --- |
| Web | Next.js 16 (App Router, server rendering), React 19, Tailwind CSS 4 |
| API | NestJS 11, TypeScript |
| Database | PostgreSQL 16 with Drizzle ORM (SQL migrations in `apps/api/drizzle`) |
| Auth | bcrypt password hashes, JWT in an httpOnly cookie; `Authorization: Bearer` also accepted for the future mobile app |
| Fonts | Literata and Public Sans, self-hosted (no calls to Google) |

The browser only talks to the Next.js server. Next.js proxies `/api/*` to the NestJS API, so the session cookie is first-party. The mobile app (v3) will call the same API with a Bearer token; the API already returns the token on sign-in for that.

## Run it locally

Needs Node.js 20.9+ and either Docker or a local PostgreSQL 16.

```bash
npm install

# 1. Database
npm run db:up                       # starts Postgres in Docker (or use your own)

# 2. Configure
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
# In apps/api/.env set JWT_SECRET, SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"   # a JWT_SECRET

# 3. Create tables and starter content
npm run db:migrate
npm run db:seed                     # admin account + 8 topics, 18 FAQs, 3 articles

# 4. Start (two terminals)
npm run dev:api                     # http://localhost:4000
npm run dev:web                     # http://localhost:3000
```

Sign in at http://localhost:3000/login with the seed admin email and password.

The seed is safe to run again: it only adds what is missing and never overwrites edits made in the admin.

## Tests

```bash
createdb perio_test                 # an EMPTY database; the tests wipe it
# set TEST_DATABASE_URL in apps/api/.env
npm test
```

17 API tests cover sign-up and roles, CSRF protection, draft/publish, search, clinical review rules, members-only content and the public forms.

## Starter content: read before launch

The 18 FAQs and 3 articles in `apps/api/src/db/seed-content.ts` are **drafts written to show how the hub works**. They are published but **not clinically reviewed**, so the site labels each one "Awaiting clinical review". Before launch, the specialist should read each one in the admin, correct it, and click **Mark as reviewed**, or unpublish it.

## Before launch checklist

- [ ] Final brand name, contact email and profile details in `apps/web/src/site.config.ts` (search for `TODO`)
- [ ] Qualifications and dental council registration number on the About page
- [ ] Review or replace every starter FAQ and article
- [ ] Legal review of the privacy notice (Digital Personal Data Protection Act 2023) and of patient-facing content against the Dental Council of India code of ethics on advertising
- [ ] Production secrets: long random `JWT_SECRET`, strong admin password, `COOKIE_SECURE=true`
- [ ] Domain, HTTPS, `SITE_URL` and `WEB_ORIGIN` set to the real address
- [ ] Database backups

## Deploying

Suggested: AWS Mumbai (`ap-south-1`) so data stays in India.

- **Database**: Amazon RDS for PostgreSQL 16.
- **API**: `npm run build -w apps/api`, then `npm run db:migrate:prod -w apps/api` and `npm start -w apps/api`. It does not need to be public; only the web server calls it.
- **Web**: `npm run build -w apps/web` and `npm start -w apps/web`, with `API_URL` pointing at the API.
- Both run fine as containers (ECS/App Runner) or on one small EC2 instance behind a load balancer with HTTPS.

## Security notes

- Passwords hashed with bcrypt (cost 12); login responds the same way for unknown emails and wrong passwords.
- Session cookie is httpOnly, SameSite=Lax, Secure in production. The API rejects non-JSON writes, so cross-site forms cannot act as a signed-in user.
- Rate limits: 120 requests/minute per IP overall, 10/minute for sign-in and sign-up, 5/minute for the public forms. Honeypot field on public forms.
- Input validation on every endpoint; unknown fields are rejected (so sign-up cannot set a role).
- Markdown is rendered without raw HTML, so stored content cannot inject scripts.
- Security headers via Helmet (API) and Next.js config (web).
- `npm audit` may report advisories in `drizzle-kit` (development tooling only, not in the running app).

## Project layout

```
apps/
  api/                      NestJS API
    drizzle/                SQL migrations
    src/
      auth/                 sign-up, sign-in, roles guard
      content/              FAQs, articles, topics, search (public + admin)
      inbox/                questions, clinic enquiries, stats, members
      db/                   schema, migrations runner, seed + starter content
    test/                   end-to-end tests
  web/                      Next.js site
    src/app/                pages (public, account, admin)
    src/components/         UI, forms, admin editor
    src/site.config.ts      brand and profile placeholders
```

## Changing the database

Edit `apps/api/src/db/schema.ts`, then:

```bash
npm run db:generate                 # writes a new SQL migration
npm run db:migrate
```

## Next (v2: teaching)

Webinars with an embedded video SDK (100ms or LiveKit), recordings, paid courses, certificates, and payments (Razorpay + Stripe) with GST invoices. The account system, roles and admin console here are built to extend to those.
