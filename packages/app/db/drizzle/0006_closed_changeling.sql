ALTER TABLE "calcom_users" ALTER COLUMN "id" SET DATA TYPE integer USING id::integer;
ALTER TABLE "profiles" ALTER COLUMN "calcom_user_id" SET DATA TYPE integer USING "calcom_user_id"::integer;