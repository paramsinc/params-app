ALTER TABLE "profiles" ALTER COLUMN "cal_com_account_id" SET DATA TYPE integer USING "cal_com_account_id"::integer;--> statement-breakpoint
ALTER TABLE "repositories" ADD COLUMN "index" serial NOT NULL;