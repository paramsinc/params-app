DO $$ BEGIN
 CREATE TYPE "public"."currency" AS ENUM('usd');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "profile_onetime_plans" ALTER COLUMN "currency" SET DATA TYPE currency USING currency::currency;
