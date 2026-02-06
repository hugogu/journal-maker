ALTER TABLE "analysis_entries" ADD COLUMN "event_name" varchar(100);--> statement-breakpoint
CREATE INDEX "idx_analysis_entries_event_name" ON "analysis_entries" USING btree ("event_name");