ALTER TABLE "google_calendar_integrations" RENAME COLUMN "user_id" TO "google_user_id";--> statement-breakpoint
ALTER TABLE "google_calendar_integrations" DROP CONSTRAINT "google_calendar_integrations_user_id_unique";--> statement-breakpoint
ALTER TABLE "google_calendar_integrations" ADD COLUMN "picture_url" text;--> statement-breakpoint
ALTER TABLE "google_calendar_integrations" ADD COLUMN "email" text NOT NULL;--> statement-breakpoint
ALTER TABLE "google_calendar_integrations" ADD CONSTRAINT "google_calendar_integrations_google_user_id_unique" UNIQUE("google_user_id");