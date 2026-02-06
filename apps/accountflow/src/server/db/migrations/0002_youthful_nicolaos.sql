ALTER TABLE "analysis_entries" DROP CONSTRAINT "unique_scenario_entry_id";--> statement-breakpoint
ALTER TABLE "analysis_subjects" DROP CONSTRAINT "unique_scenario_subject_code";--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_company_id_company_profile_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenarios" ADD CONSTRAINT "scenarios_company_id_company_profile_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_company_id_company_profile_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analysis_entries" ADD CONSTRAINT "unique_scenario_entry_message_id" UNIQUE("scenario_id","source_message_id","entry_id");--> statement-breakpoint
ALTER TABLE "analysis_subjects" ADD CONSTRAINT "unique_scenario_subject_message_code" UNIQUE("scenario_id","source_message_id","code");