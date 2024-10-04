CREATE TABLE IF NOT EXISTS "google_calendar_integrations" (
	"access_token" text NOT NULL,
	"refresh_token" text NOT NULL,
	"expires_at_ms" integer NOT NULL,
	"id_token" text NOT NULL,
	"profile_id" text NOT NULL,
	"calendars_for_avail_blocking" jsonb NOT NULL,
	"user_id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "google_calendar_integrations_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "google_calendar_integrations" ADD CONSTRAINT "google_calendar_integrations_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
