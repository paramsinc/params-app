CREATE TABLE IF NOT EXISTS "profile_onetime_plans" (
	"id" text PRIMARY KEY NOT NULL,
	"profile_id" text NOT NULL,
	"price" integer NOT NULL,
	"currency" text NOT NULL,
	"duration_mins" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "profile_onetime_plans" ADD CONSTRAINT "profile_onetime_plans_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
