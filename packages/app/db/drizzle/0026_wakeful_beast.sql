ALTER TABLE "profiles" ADD COLUMN "personal_profile_user_id" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "profiles" ADD CONSTRAINT "profiles_personal_profile_user_id_users_id_fk" FOREIGN KEY ("personal_profile_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_personal_profile_user_id_unique" UNIQUE("personal_profile_user_id");