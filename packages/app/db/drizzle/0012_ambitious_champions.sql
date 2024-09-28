ALTER TABLE "bookings" ADD COLUMN "google_calendar_event_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "start_datetime" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "duration_minutes" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "timezone" text NOT NULL;--> statement-breakpoint
ALTER TABLE "offers" ADD COLUMN "start_datetime" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "offers" ADD COLUMN "duration_minutes" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "offers" ADD COLUMN "timezone" text NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" DROP COLUMN IF EXISTS "calcom_booking_id";--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_offer_id_unique" UNIQUE("offer_id");