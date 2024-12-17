ALTER TABLE "users" ADD COLUMN "can_create_profiles" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_banned" boolean DEFAULT false;