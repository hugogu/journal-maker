CREATE TABLE IF NOT EXISTS "confirmed_analysis" (
	"id" serial PRIMARY KEY NOT NULL,
	"scenario_id" integer NOT NULL,
	"subjects" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"rules" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"diagram_mermaid" text,
	"source_message_id" integer,
	"confirmed_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "confirmed_analysis_scenario_id_unique" UNIQUE("scenario_id")
);
--> statement-breakpoint
ALTER TABLE "confirmed_analysis" ADD CONSTRAINT "confirmed_analysis_scenario_id_scenarios_id_fk" FOREIGN KEY ("scenario_id") REFERENCES "public"."scenarios"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "confirmed_analysis" ADD CONSTRAINT "confirmed_analysis_source_message_id_conversation_messages_id_fk" FOREIGN KEY ("source_message_id") REFERENCES "public"."conversation_messages"("id") ON DELETE set null ON UPDATE no action;
