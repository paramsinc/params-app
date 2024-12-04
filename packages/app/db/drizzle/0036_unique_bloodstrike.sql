DROP TABLE "calcom_users";--> statement-breakpoint
ALTER TABLE "profile_members" ADD CONSTRAINT "profile_members_profile_id_email_unique" UNIQUE("profile_id","email");