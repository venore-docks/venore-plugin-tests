CREATE TABLE "tests"."attempts" (
	"id" text PRIMARY KEY NOT NULL,
	"module_id" text NOT NULL,
	"instance_id" text,
	"question_set_id" text NOT NULL,
	"question_set_version" integer NOT NULL,
	"user_id" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"finished_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "tests"."question_set_versions" (
	"set_id" text NOT NULL,
	"version" integer NOT NULL,
	"title" text NOT NULL,
	"content" jsonb NOT NULL,
	"published_by_user_id" text,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "question_set_versions_set_id_version_pk" PRIMARY KEY("set_id","version")
);
--> statement-breakpoint
CREATE TABLE "tests"."question_sets" (
	"id" text PRIMARY KEY NOT NULL,
	"module_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"draft" jsonb NOT NULL,
	"published_version" integer,
	"is_default" boolean DEFAULT false NOT NULL,
	"archived_at" timestamp with time zone,
	"created_by_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tests"."instances" ADD COLUMN "question_set_id" text;--> statement-breakpoint
ALTER TABLE "tests"."instances" ADD COLUMN "question_set_version" integer;--> statement-breakpoint
ALTER TABLE "tests"."results" ADD COLUMN "question_set_id" text;--> statement-breakpoint
ALTER TABLE "tests"."results" ADD COLUMN "question_set_version" integer;--> statement-breakpoint
ALTER TABLE "tests"."attempts" ADD CONSTRAINT "attempts_instance_id_instances_id_fk" FOREIGN KEY ("instance_id") REFERENCES "tests"."instances"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tests"."question_set_versions" ADD CONSTRAINT "question_set_versions_set_id_question_sets_id_fk" FOREIGN KEY ("set_id") REFERENCES "tests"."question_sets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "attempts_instance_idx" ON "tests"."attempts" USING btree ("instance_id");--> statement-breakpoint
CREATE INDEX "question_sets_module_idx" ON "tests"."question_sets" USING btree ("module_id");--> statement-breakpoint
CREATE UNIQUE INDEX "question_sets_default_unique" ON "tests"."question_sets" USING btree ("module_id") WHERE "tests"."question_sets"."is_default" = true;--> statement-breakpoint
ALTER TABLE "tests"."instances" ADD CONSTRAINT "instances_question_set_id_question_sets_id_fk" FOREIGN KEY ("question_set_id") REFERENCES "tests"."question_sets"("id") ON DELETE restrict ON UPDATE no action;