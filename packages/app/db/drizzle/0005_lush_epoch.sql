CREATE TABLE IF NOT EXISTS "calcom_users" (
	"id" integer PRIMARY KEY NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "calcom_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "calcom_user_id" integer NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "profiles" ADD CONSTRAINT "profiles_calcom_user_id_calcom_users_id_fk" FOREIGN KEY ("calcom_user_id") REFERENCES "public"."calcom_users"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "profiles" DROP COLUMN IF EXISTS "cal_com_account_id";--> statement-breakpoint
ALTER TABLE "profiles" DROP COLUMN IF EXISTS "cal_com_access_token";--> statement-breakpoint
ALTER TABLE "profiles" DROP COLUMN IF EXISTS "cal_com_refresh_token";