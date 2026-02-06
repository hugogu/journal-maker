ALTER TABLE "journal_rules" ADD COLUMN "message_id" integer;--> statement-breakpoint
ALTER TABLE "journal_rules" ADD CONSTRAINT "journal_rules_message_id_conversation_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."conversation_messages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_journal_rules_message_id" ON "journal_rules" USING btree ("message_id");--> statement-breakpoint
ALTER TABLE "journal_rules" ADD CONSTRAINT "unique_journal_rule" UNIQUE("scenario_id","message_id","event_name");