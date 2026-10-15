CREATE SCHEMA "tests";
--> statement-breakpoint
CREATE TABLE "tests"."instances" (
	"id" text PRIMARY KEY NOT NULL,
	"test_id" text DEFAULT 'disc' NOT NULL,
	"team_id" text,
	"title" text,
	"context_label" text DEFAULT 'Geral' NOT NULL,
	"share_slug" text NOT NULL,
	"created_by_user_id" text,
	"redirect_url" text,
	"external_ref" text,
	"identity_mode" text DEFAULT 'identified' NOT NULL,
	"show_result_to_participant" boolean DEFAULT true NOT NULL,
	"closed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "instances_share_slug_unique" UNIQUE("share_slug")
);
--> statement-breakpoint
CREATE TABLE "tests"."module_settings" (
	"module_id" text PRIMARY KEY NOT NULL,
	"enabled" boolean NOT NULL,
	"updated_by_user_id" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tests"."results" (
	"id" text PRIMARY KEY NOT NULL,
	"test_id" text NOT NULL,
	"test_version" text NOT NULL,
	"user_id" text,
	"instance_id" text,
	"context_label" text NOT NULL,
	"participant_name" text,
	"participant_email" text,
	"participant_email_key" text,
	"dataset" jsonb NOT NULL,
	"headline" text NOT NULL,
	"headline_secondary" text,
	"unclaimed_expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tests"."team_members" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tests"."teams" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_user_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tests"."instances" ADD CONSTRAINT "instances_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "tests"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tests"."results" ADD CONSTRAINT "results_instance_id_instances_id_fk" FOREIGN KEY ("instance_id") REFERENCES "tests"."instances"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tests"."team_members" ADD CONSTRAINT "team_members_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "tests"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "instances_external_ref_unique" ON "tests"."instances" USING btree ("external_ref") WHERE "tests"."instances"."external_ref" is not null;--> statement-breakpoint
CREATE INDEX "instances_team_idx" ON "tests"."instances" USING btree ("team_id");--> statement-breakpoint
CREATE UNIQUE INDEX "results_instance_participant_unique" ON "tests"."results" USING btree ("instance_id","participant_email_key") WHERE "tests"."results"."instance_id" is not null and "tests"."results"."participant_email_key" is not null;--> statement-breakpoint
CREATE INDEX "results_user_idx" ON "tests"."results" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "results_instance_idx" ON "tests"."results" USING btree ("instance_id");