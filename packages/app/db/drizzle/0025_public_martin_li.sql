ALTER TABLE "bookings" ADD COLUMN "canceled_at" timestamp;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "canceled_by_user_id" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bookings" ADD CONSTRAINT "bookings_canceled_by_user_id_users_id_fk" FOREIGN KEY ("canceled_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
