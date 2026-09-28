# Perio Knowledge Hub — v1

A periodontal knowledge and education site: a public knowledge hub with separate tracks for **patients** and **dentists**, a question inbox, a clinic enquiry form, free dentist accounts with members-only content, and an admin console with clinical review.

"Perio Knowledge Hub" is a placeholder name. Everything brand-specific is in `src/site.config.ts`.

It is one Next.js app. Pages and the JSON API (`/api/*`) deploy together to Netlify, with the database on Netlify Database (or any Postgres).

## Deploy to Netlify

You need: a Netlify account on a **paid plan (Personal or above)** if you want Netlify Database, which is not on the free plan. On the free plan, use a free external Postgres instead (option B).

1. **Import the repo.** In Netlify: **Add new project → Import an existing project → GitHub →** pick this repository. Leave the build settings as detected (`netlify.toml` sets them). Don't deploy yet if it lets you skip; if it deploys anyway, the first deploy will fail until steps 2–3 are done, which is fine.

2. **Add a database** (choose one):
   - **A. Netlify Database:** in the project, **Data & Storage → Database → Create database**. Netlify connects it automatically and applies the migrations in `netlify/database/migrations` on every deploy, including the starter content.
   - **B. External Postgres (e.g. a free Neon database):** create a database, copy its connection string, and add it as the `DATABASE_URL` environment variable (step 3). The build applies the migrations itself.

3. **Environment variables** (**Project configuration → Environment variables**):

   | Name | Value |
   | --- | --- |
   | `JWT_SECRET` | A long random string. Generate one at a terminal with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`, or use any password generator set to 64 characters. |
   | `SETUP_TOKEN` | Any secret of 12+ characters. You type it once on the setup page. |
   | `DATABASE_URL` | Only for option B. |
   | `SITE_URL` | Optional. Your final address, e.g. `https://example.com`. Defaults to the Netlify address. |

4. **Deploy** (**Deploys → Trigger deploy → Deploy site**).

5. **Create the admin account.** Open `https://<your-site>/setup`, enter the `SETUP_TOKEN`, and create the specialist's account. The page closes itself once an admin exists.

6. **Sign in** at `/login` and review the starter content in `/admin`.

Every push to `main` redeploys automatically.

## What's in v1

**Public site:** home page with a patient/dentist switch, search and most-read questions; FAQ library by audience and topic with prefix search ("bleed gum" finds "bleeding gums"); FAQ pages with short answer, full answer, references, related questions and FAQ structured data for Google; a **"Clinically reviewed by … on …"** or **"Awaiting clinical review"** line on every answer; articles, including members-only ones; ask a question; clinic enquiry; About; Privacy (draft); sitemap and robots.txt.

**Accounts:** free dentist/student sign-up (public sign-up can only ever create the `DENTIST` role). Roles: `ADMIN` (the specialist), `STAFF` (an assistant), `DENTIST`.

**Admin (`/admin`):** overview; FAQ and article editor with Markdown preview, publish/unpublish, delete; **clinical review** (only `ADMIN` can mark content reviewed; editing the question, summary, answer, references or audience clears the review automatically); question inbox with "Start FAQ draft"; clinic enquiry inbox; member list (`ADMIN` only).

## Starter content: read before launch

The 18 FAQs and 3 articles in `src/server/seed-content.ts` are **drafts written to show how the hub works**. They are published but **not clinically reviewed**, so the site labels each one "Awaiting clinical review". Before launch, the specialist should read each one in the admin, correct it and click **Mark as reviewed**, or unpublish it.

The content loads through the migration `0002_starter_content.sql`, which runs once. Deleting a starter FAQ in the admin removes it for good.

## Run it locally

Needs Node.js 20.9+ and Postgres 16 (Docker works: `npm run db:up`).

```bash
npm install
cp .env.example .env.local       # set JWT_SECRET and SETUP_TOKEN
npm run db:up                    # or point DATABASE_URL at your own Postgres
npm run db:migrate               # tables + starter content
npm run dev                      # http://localhost:3000, then open /setup
```

## Tests

```bash
createdb perio_test              # an EMPTY database; the tests wipe it
# set TEST_DATABASE_URL in .env.local
npm run build && npm test
```

22 end-to-end tests start the built app and call the real API: first-run setup, sign-up and roles, CSRF protection, draft/publish, search, clinical review rules, members-only content, public forms and rate limiting.

## How it fits together

```
src/
  app/                  pages (public, account, admin, setup)
  app/api/              JSON API as route handlers; also what the mobile app will use
  server/               database, auth, validation, rate limiting, services (server only)
  components/           UI, forms, admin editor
  site.config.ts        brand and profile placeholders
drizzle/                migrations as generated by drizzle-kit (with its metadata)
netlify/database/migrations/   the same SQL files, where Netlify applies them
scripts/                migrate, prebuild, starter-content generator, create-admin
test/                   end-to-end API tests
```

Pages read data by calling the same route handlers in-process, so the website, the API and a future mobile app share one set of validation and permission checks. The API accepts either the session cookie (website) or `Authorization: Bearer <token>` (mobile app); sign-in returns the token.

## Changing the database

Edit `src/server/schema.ts`, then:

```bash
npm run db:generate              # writes a new migration to drizzle/ and copies it to netlify/database/migrations
npm run db:migrate               # apply locally
```

Commit both folders. Netlify applies new migrations on the next deploy. To change the starter content before first launch, edit `src/server/seed-content.ts` and run `npx tsx scripts/build-starter-sql.ts && npx tsx scripts/sync-migrations.ts`.

## Security notes

- Passwords hashed with bcrypt (cost 12); login gives the same answer for an unknown email and a wrong password.
- Session cookie is httpOnly, SameSite=Lax, and Secure on HTTPS. The API refuses non-JSON writes, so cross-site forms cannot act as a signed-in user.
- Rate limits, stored in the database so they hold across serverless instances: 10 per minute per IP for sign-in and sign-up, 5 for the public forms and setup. Honeypot field on public forms.
- All input validated; unknown fields are rejected (so sign-up cannot set a role).
- Markdown is rendered without raw HTML, so stored content cannot inject scripts.
- `/setup` works only with the `SETUP_TOKEN` and only until the first admin exists.

## Before launch checklist

- [ ] Brand name, contact email and profile details in `src/site.config.ts` (search for `TODO`)
- [ ] Qualifications and dental council registration number on the About page
- [ ] Review or replace every starter FAQ and article
- [ ] Legal review of the privacy notice (Digital Personal Data Protection Act 2023) and of patient-facing content against the Dental Council of India code of ethics on advertising
- [ ] Custom domain in Netlify, and `SITE_URL` set to it
- [ ] Check which region the database is in; for patient case files later (v3), data residency in India may matter

## Next (v2: teaching)

Webinars with an embedded video SDK (100ms or LiveKit), recordings, paid courses, certificates, and payments (Razorpay + Stripe) with GST invoices.
