CREATE TABLE IF NOT EXISTS "github_repo_integrations" (
	"repo_id" text PRIMARY KEY NOT NULL,
	"github_integration_user_id" text NOT NULL,
	"github_repo_id" bigint NOT NULL,
	"github_repo_name" text NOT NULL,
	"github_repo_owner" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "github_repo_integrations" ADD CONSTRAINT "github_repo_integrations_repo_id_repositories_id_fk" FOREIGN KEY ("repo_id") REFERENCES "public"."repositories"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "github_repo_integrations" ADD CONSTRAINT "github_repo_integrations_github_integration_user_id_github_integrations_user_id_fk" FOREIGN KEY ("github_integration_user_id") REFERENCES "public"."github_integrations"("user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "index_profile_slug" ON "profiles" USING btree ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "index_repository_slug" ON "repositories" USING btree ("slug");