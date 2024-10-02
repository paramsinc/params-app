ALTER TABLE "profiles" DROP CONSTRAINT "profiles_calcom_user_id_calcom_users_id_fk";
--> statement-breakpoint
ALTER TABLE "profiles" DROP COLUMN IF EXISTS "calcom_user_id";