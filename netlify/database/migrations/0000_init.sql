CREATE TYPE "public"."audience" AS ENUM('DENTIST', 'PATIENT');--> statement-breakpoint
CREATE TYPE "public"."content_status" AS ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."enquiry_status" AS ENUM('NEW', 'CONTACTED', 'CLOSED');--> statement-breakpoint
CREATE TYPE "public"."question_status" AS ENUM('NEW', 'ANSWERED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('ADMIN', 'STAFF', 'DENTIST');--> statement-breakpoint
CREATE TABLE "articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"audience" "audience" NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"body" text NOT NULL,
	"members_only" boolean DEFAULT false NOT NULL,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"status" "content_status" DEFAULT 'DRAFT' NOT NULL,
	"category_id" uuid NOT NULL,
	"reviewed_at" timestamp with time zone,
	"reviewed_by_id" uuid,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "articles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "clinic_enquiries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinic_name" text NOT NULL,
	"contact_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"city" text NOT NULL,
	"preferred_dates" text,
	"procedures" text,
	"message" text,
	"status" "enquiry_status" DEFAULT 'NEW' NOT NULL,
	"admin_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "faqs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"audience" "audience" NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"summary" text NOT NULL,
	"references" text,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"status" "content_status" DEFAULT 'DRAFT' NOT NULL,
	"category_id" uuid NOT NULL,
	"reviewed_at" timestamp with time zone,
	"reviewed_by_id" uuid,
	"view_count" integer DEFAULT 0 NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "faqs_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"audience" "audience" NOT NULL,
	"question" text NOT NULL,
	"status" "question_status" DEFAULT 'NEW' NOT NULL,
	"admin_note" text,
	"faq_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text NOT NULL,
	"role" "role" DEFAULT 'DENTIST' NOT NULL,
	"phone" text,
	"city" text,
	"registration_no" text,
	"is_student" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_reviewed_by_id_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faqs" ADD CONSTRAINT "faqs_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faqs" ADD CONSTRAINT "faqs_reviewed_by_id_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_faq_id_faqs_id_fk" FOREIGN KEY ("faq_id") REFERENCES "public"."faqs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "articles_audience_status_idx" ON "articles" USING btree ("audience","status");--> statement-breakpoint
CREATE INDEX "articles_search_idx" ON "articles" USING gin (to_tsvector('english', "title" || ' ' || "summary" || ' ' || "body"));--> statement-breakpoint
CREATE INDEX "clinic_enquiries_status_idx" ON "clinic_enquiries" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "faqs_audience_status_idx" ON "faqs" USING btree ("audience","status");--> statement-breakpoint
CREATE INDEX "faqs_category_idx" ON "faqs" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "faqs_search_idx" ON "faqs" USING gin (to_tsvector('english', "question" || ' ' || "summary" || ' ' || "answer"));--> statement-breakpoint
CREATE INDEX "questions_status_idx" ON "questions" USING btree ("status","created_at");