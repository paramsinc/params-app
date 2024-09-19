CREATE TABLE IF NOT EXISTS "users" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "users_slug_unique" UNIQUE("slug"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
