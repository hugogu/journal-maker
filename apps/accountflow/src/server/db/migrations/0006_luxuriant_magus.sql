CREATE TABLE "accounting_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"scenario_id" integer NOT NULL,
	"source_message_id" integer,
	"event_name" varchar(100) NOT NULL,
	"description" text,
	"event_type" varchar(50),
	"metadata" jsonb,
	"is_confirmed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_scenario_event_name" UNIQUE("scenario_id","event_name")
);
--> statement-breakpoint
ALTER TABLE "analysis_entries" ADD COLUMN "event_id" integer;--> statement-breakpoint
ALTER TABLE "journal_rules" ADD COLUMN "event_id" integer;--> statement-breakpoint
ALTER TABLE "accounting_events" ADD CONSTRAINT "accounting_events_scenario_id_scenarios_id_fk" FOREIGN KEY ("scenario_id") REFERENCES "public"."scenarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounting_events" ADD CONSTRAINT "accounting_events_source_message_id_conversation_messages_id_fk" FOREIGN KEY ("source_message_id") REFERENCES "public"."conversation_messages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_accounting_events_scenario_id" ON "accounting_events" USING btree ("scenario_id");--> statement-breakpoint
CREATE INDEX "idx_accounting_events_source_message_id" ON "accounting_events" USING btree ("source_message_id");--> statement-breakpoint
CREATE INDEX "idx_accounting_events_is_confirmed" ON "accounting_events" USING btree ("is_confirmed");--> statement-breakpoint
ALTER TABLE "analysis_entries" ADD CONSTRAINT "analysis_entries_event_id_accounting_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."accounting_events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_rules" ADD CONSTRAINT "journal_rules_event_id_accounting_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."accounting_events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_analysis_entries_event_id" ON "analysis_entries" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "idx_journal_rules_event_id" ON "journal_rules" USING btree ("event_id");--> statement-breakpoint
-- Backfill: Create events from existing journal_rules eventName strings
INSERT INTO accounting_events (scenario_id, event_name, description, is_confirmed, created_at, updated_at)
SELECT DISTINCT ON (jr.scenario_id, jr.event_name)
  jr.scenario_id,
  jr.event_name,
  jr.event_description,
  true,
  MIN(jr.created_at) OVER (PARTITION BY jr.scenario_id, jr.event_name),
  NOW()
FROM journal_rules jr
WHERE jr.event_name IS NOT NULL
ON CONFLICT (scenario_id, event_name) DO NOTHING;--> statement-breakpoint
-- Backfill: Create events from analysis_entries not already covered
INSERT INTO accounting_events (scenario_id, event_name, is_confirmed, created_at, updated_at)
SELECT DISTINCT ON (ae.scenario_id, ae.event_name)
  ae.scenario_id,
  ae.event_name,
  false,
  MIN(ae.created_at) OVER (PARTITION BY ae.scenario_id, ae.event_name),
  NOW()
FROM analysis_entries ae
WHERE ae.event_name IS NOT NULL
ON CONFLICT (scenario_id, event_name) DO NOTHING;--> statement-breakpoint
-- Backfill: Link journal_rules to events
UPDATE journal_rules jr
SET event_id = ev.id
FROM accounting_events ev
WHERE jr.scenario_id = ev.scenario_id
  AND LOWER(jr.event_name) = LOWER(ev.event_name)
  AND jr.event_name IS NOT NULL;--> statement-breakpoint
-- Backfill: Link analysis_entries to events
UPDATE analysis_entries ae
SET event_id = ev.id
FROM accounting_events ev
WHERE ae.scenario_id = ev.scenario_id
  AND LOWER(ae.event_name) = LOWER(ev.event_name)
  AND ae.event_name IS NOT NULL;