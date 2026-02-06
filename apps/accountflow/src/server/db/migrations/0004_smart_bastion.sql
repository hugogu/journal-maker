ALTER TABLE "journal_rules" DROP CONSTRAINT "unique_journal_rule";--> statement-breakpoint
ALTER TABLE "journal_rules" ADD COLUMN "rule_key" varchar(50) NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_journal_rules_rule_key" ON "journal_rules" USING btree ("rule_key");--> statement-breakpoint
ALTER TABLE "journal_rules" ADD CONSTRAINT "unique_journal_rule" UNIQUE("scenario_id","message_id","rule_key");