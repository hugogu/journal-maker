-- ============================================================================
-- AccountFlow Database Schema - Initial Migration
-- ============================================================================
-- Version: 1.0
-- Created: 2026-02-06
-- Description: Consolidated schema with optimized structure for AI-assisted
--              accounting analysis. Includes core business entities, AI
--              configuration, and structured analysis storage.
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================

-- User roles in the system
CREATE TYPE "public"."user_role" AS ENUM('admin', 'product');

-- Account types following standard accounting classification
CREATE TYPE "public"."account_type" AS ENUM('asset', 'liability', 'equity', 'revenue', 'expense');

-- Account normal balance direction
CREATE TYPE "public"."account_direction" AS ENUM('debit', 'credit', 'both');

-- Scenario lifecycle status
CREATE TYPE "public"."scenario_status" AS ENUM('draft', 'confirmed', 'archived');

-- AI provider types
CREATE TYPE "public"."provider_type" AS ENUM('openai', 'azure', 'ollama', 'custom');

-- AI provider operational status
CREATE TYPE "public"."provider_status" AS ENUM('active', 'inactive', 'error');

-- Prompt template scenario types
CREATE TYPE "public"."prompt_scenario_type" AS ENUM(
  'scenario_analysis',
  'sample_generation',
  'prompt_generation',
  'flowchart_generation'
);

-- Message roles in AI conversation
CREATE TYPE "public"."message_role" AS ENUM('user', 'assistant', 'system');

-- Journal rule status
CREATE TYPE "public"."journal_rule_status" AS ENUM('proposal', 'confirmed');

-- Analysis diagram types
CREATE TYPE "public"."analysis_diagram_type" AS ENUM('mermaid', 'chart', 'table');

-- ============================================================================
-- CORE BUSINESS TABLES
-- ============================================================================

-- Companies: Multi-tenant organization entities
CREATE TABLE "public"."companies" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(100) NOT NULL,
  "description" TEXT,
  "industry" VARCHAR(50),
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);
COMMENT ON TABLE "public"."companies" IS 'Organization/tenant entities for multi-company support';
COMMENT ON COLUMN "public"."companies"."name" IS 'Company legal name';
COMMENT ON COLUMN "public"."companies"."industry" IS 'Industry classification (e.g., manufacturing, retail, services)';

-- Users: System users with role-based access
CREATE TABLE "public"."users" (
  "id" SERIAL PRIMARY KEY,
  "company_id" INTEGER NOT NULL,
  "name" VARCHAR(100) NOT NULL,
  "email" VARCHAR(255) NOT NULL UNIQUE,
  "role" "user_role" DEFAULT 'product' NOT NULL,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL,

  CONSTRAINT "users_company_id_fk" FOREIGN KEY ("company_id")
    REFERENCES "public"."companies"("id") ON DELETE CASCADE
);
COMMENT ON TABLE "public"."users" IS 'System users with company affiliation and role-based permissions';
COMMENT ON COLUMN "public"."users"."role" IS 'User role: admin (full access) or product (business user)';

CREATE INDEX "idx_users_company_id" ON "public"."users"("company_id");
CREATE INDEX "idx_users_email" ON "public"."users"("email");

-- Accounts: Chart of accounts (GL codes)
CREATE TABLE "public"."accounts" (
  "id" SERIAL PRIMARY KEY,
  "company_id" INTEGER NOT NULL,
  "code" VARCHAR(20) NOT NULL,
  "name" VARCHAR(100) NOT NULL,
  "type" "account_type" NOT NULL,
  "direction" "account_direction" NOT NULL,
  "description" TEXT,
  "parent_id" INTEGER,
  "is_active" BOOLEAN DEFAULT TRUE NOT NULL,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL,

  CONSTRAINT "accounts_company_id_fk" FOREIGN KEY ("company_id")
    REFERENCES "public"."companies"("id") ON DELETE CASCADE,
  CONSTRAINT "accounts_parent_id_fk" FOREIGN KEY ("parent_id")
    REFERENCES "public"."accounts"("id") ON DELETE SET NULL,
  CONSTRAINT "unique_company_account_code" UNIQUE("company_id", "code")
);
COMMENT ON TABLE "public"."accounts" IS 'Chart of accounts - general ledger account codes';
COMMENT ON COLUMN "public"."accounts"."code" IS 'Account code (e.g., 1001, 5001)';
COMMENT ON COLUMN "public"."accounts"."type" IS 'Account type per accounting equation';
COMMENT ON COLUMN "public"."accounts"."direction" IS 'Normal balance direction (debit/credit/both)';
COMMENT ON COLUMN "public"."accounts"."parent_id" IS 'Parent account for hierarchical chart of accounts';

CREATE INDEX "idx_accounts_company_id" ON "public"."accounts"("company_id");
CREATE INDEX "idx_accounts_type" ON "public"."accounts"("type");
CREATE INDEX "idx_accounts_parent_id" ON "public"."accounts"("parent_id");
CREATE INDEX "idx_accounts_code" ON "public"."accounts"("code");

-- Scenarios: Business scenarios for AI analysis
CREATE TABLE "public"."scenarios" (
  "id" SERIAL PRIMARY KEY,
  "company_id" INTEGER NOT NULL,
  "name" VARCHAR(100) NOT NULL,
  "description" TEXT,
  "status" "scenario_status" DEFAULT 'draft' NOT NULL,
  "is_template" BOOLEAN DEFAULT FALSE NOT NULL,
  "created_by" INTEGER NOT NULL,
  "confirmed_at" TIMESTAMP,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL,

  CONSTRAINT "scenarios_company_id_fk" FOREIGN KEY ("company_id")
    REFERENCES "public"."companies"("id") ON DELETE CASCADE,
  CONSTRAINT "scenarios_created_by_fk" FOREIGN KEY ("created_by")
    REFERENCES "public"."users"("id") ON DELETE RESTRICT
);
COMMENT ON TABLE "public"."scenarios" IS 'Business scenarios for accounting rule analysis and AI conversation';
COMMENT ON COLUMN "public"."scenarios"."status" IS 'Lifecycle status: draft (editing), confirmed (finalized), archived (inactive)';
COMMENT ON COLUMN "public"."scenarios"."is_template" IS 'Whether this scenario can be used as a template for new scenarios';
COMMENT ON COLUMN "public"."scenarios"."confirmed_at" IS 'Timestamp when scenario was confirmed/finalized';

CREATE INDEX "idx_scenarios_company_id" ON "public"."scenarios"("company_id");
CREATE INDEX "idx_scenarios_status" ON "public"."scenarios"("status");
CREATE INDEX "idx_scenarios_created_by" ON "public"."scenarios"("created_by");
CREATE INDEX "idx_scenarios_is_template" ON "public"."scenarios"("is_template");

-- Journal Rules: Accounting rules for business events
CREATE TABLE "public"."journal_rules" (
  "id" SERIAL PRIMARY KEY,
  "scenario_id" INTEGER NOT NULL,
  "event_name" VARCHAR(100) NOT NULL,
  "event_description" TEXT,
  "debit_account_id" INTEGER,
  "credit_account_id" INTEGER,
  "conditions" JSONB,
  "amount_formula" TEXT,
  "debit_side" JSONB,
  "credit_side" JSONB,
  "trigger_type" VARCHAR(50),
  "status" "journal_rule_status" DEFAULT 'proposal' NOT NULL,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL,

  CONSTRAINT "journal_rules_scenario_id_fk" FOREIGN KEY ("scenario_id")
    REFERENCES "public"."scenarios"("id") ON DELETE CASCADE,
  CONSTRAINT "journal_rules_debit_account_id_fk" FOREIGN KEY ("debit_account_id")
    REFERENCES "public"."accounts"("id") ON DELETE SET NULL,
  CONSTRAINT "journal_rules_credit_account_id_fk" FOREIGN KEY ("credit_account_id")
    REFERENCES "public"."accounts"("id") ON DELETE SET NULL
);
COMMENT ON TABLE "public"."journal_rules" IS 'Accounting journal entry rules for business events';
COMMENT ON COLUMN "public"."journal_rules"."event_name" IS 'Business event triggering this rule (e.g., "Sales Receipt", "Purchase Payment")';
COMMENT ON COLUMN "public"."journal_rules"."debit_account_id" IS 'DEPRECATED: Use debit_side instead. Simple single-account debit reference';
COMMENT ON COLUMN "public"."journal_rules"."credit_account_id" IS 'DEPRECATED: Use credit_side instead. Simple single-account credit reference';
COMMENT ON COLUMN "public"."journal_rules"."debit_side" IS 'Structured debit entries: {entries: [{accountCode, accountId, amountFormula, description}]}';
COMMENT ON COLUMN "public"."journal_rules"."credit_side" IS 'Structured credit entries: {entries: [{accountCode, accountId, amountFormula, description}]}';
COMMENT ON COLUMN "public"."journal_rules"."conditions" IS 'Rule conditions as key-value pairs (e.g., {paymentMethod: "bank_transfer"})';
COMMENT ON COLUMN "public"."journal_rules"."amount_formula" IS 'Formula for calculating amounts (e.g., "{{total}} * 1.13")';
COMMENT ON COLUMN "public"."journal_rules"."trigger_type" IS 'When this rule triggers: manual, auto, scheduled, etc.';
COMMENT ON COLUMN "public"."journal_rules"."status" IS 'Rule status: proposal (AI-generated) or confirmed (user-verified)';

CREATE INDEX "idx_journal_rules_scenario_id" ON "public"."journal_rules"("scenario_id");
CREATE INDEX "idx_journal_rules_status" ON "public"."journal_rules"("status");

-- Sample Transactions: Example journal entries
CREATE TABLE "public"."sample_transactions" (
  "id" SERIAL PRIMARY KEY,
  "scenario_id" INTEGER NOT NULL,
  "description" TEXT NOT NULL,
  "entries" JSONB NOT NULL,
  "generated_by" VARCHAR(50) NOT NULL,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL,

  CONSTRAINT "sample_transactions_scenario_id_fk" FOREIGN KEY ("scenario_id")
    REFERENCES "public"."scenarios"("id") ON DELETE CASCADE
);
COMMENT ON TABLE "public"."sample_transactions" IS 'Sample/example journal entries for demonstration and testing';
COMMENT ON COLUMN "public"."sample_transactions"."entries" IS 'Array of entry lines: [{accountId, accountCode, accountName, debit, credit, description}]';
COMMENT ON COLUMN "public"."sample_transactions"."generated_by" IS 'Source of sample: "ai" (AI-generated) or "manual" (user-created)';

CREATE INDEX "idx_sample_transactions_scenario_id" ON "public"."sample_transactions"("scenario_id");

-- ============================================================================
-- AI CONVERSATION & MESSAGING
-- ============================================================================

-- Conversation Messages: AI chat message history
CREATE TABLE "public"."conversation_messages" (
  "id" SERIAL PRIMARY KEY,
  "scenario_id" INTEGER NOT NULL,
  "role" "message_role" NOT NULL,
  "content" TEXT NOT NULL,
  "timestamp" TIMESTAMP DEFAULT NOW() NOT NULL,
  "confirmed_at" TIMESTAMP WITH TIME ZONE,
  "structured_data" JSONB,
  "request_log" JSONB,
  "response_stats" JSONB,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,

  CONSTRAINT "conversation_messages_scenario_id_fk" FOREIGN KEY ("scenario_id")
    REFERENCES "public"."scenarios"("id") ON DELETE CASCADE
);
COMMENT ON TABLE "public"."conversation_messages" IS 'AI conversation message history with structured data extraction';
COMMENT ON COLUMN "public"."conversation_messages"."role" IS 'Message sender: user, assistant (AI), or system';
COMMENT ON COLUMN "public"."conversation_messages"."content" IS 'Message text content (markdown formatted)';
COMMENT ON COLUMN "public"."conversation_messages"."structured_data" IS 'Parsed structured data from AI response (accounts, rules, diagrams)';
COMMENT ON COLUMN "public"."conversation_messages"."request_log" IS 'AI request metadata: {systemPrompt, contextMessages, fullPrompt, variables}';
COMMENT ON COLUMN "public"."conversation_messages"."response_stats" IS 'AI response statistics: {model, providerId, inputTokens, outputTokens, durationMs}';
COMMENT ON COLUMN "public"."conversation_messages"."confirmed_at" IS 'Timestamp when message was confirmed by user (null means not confirmed)';

CREATE INDEX "idx_conversation_messages_confirmed_at" ON "public"."conversation_messages"("confirmed_at") WHERE confirmed_at IS NOT NULL;
CREATE INDEX "idx_conversation_messages_scenario_id" ON "public"."conversation_messages"("scenario_id");
CREATE INDEX "idx_conversation_messages_timestamp" ON "public"."conversation_messages"("timestamp");
CREATE INDEX "idx_conversation_messages_role" ON "public"."conversation_messages"("role");

-- Conversation Shares: Public sharing tokens
CREATE TABLE "public"."conversation_shares" (
  "id" SERIAL PRIMARY KEY,
  "scenario_id" INTEGER NOT NULL,
  "share_token" VARCHAR(64) NOT NULL UNIQUE,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "revoked_at" TIMESTAMP,
  "is_revoked" BOOLEAN DEFAULT FALSE NOT NULL,

  CONSTRAINT "conversation_shares_scenario_id_fk" FOREIGN KEY ("scenario_id")
    REFERENCES "public"."scenarios"("id") ON DELETE CASCADE
);
COMMENT ON TABLE "public"."conversation_shares" IS 'Public sharing tokens for conversation access without authentication';
COMMENT ON COLUMN "public"."conversation_shares"."share_token" IS 'Unique token for public URL access';
COMMENT ON COLUMN "public"."conversation_shares"."is_revoked" IS 'Whether this share link has been revoked';

CREATE INDEX "idx_conversation_shares_token" ON "public"."conversation_shares"("share_token");
CREATE INDEX "idx_conversation_shares_scenario_id" ON "public"."conversation_shares"("scenario_id");

-- ============================================================================
-- AI ANALYSIS ARTIFACTS (Normalized Storage)
-- ============================================================================

-- Analysis Subjects: Accounting subjects extracted from AI analysis
CREATE TABLE "public"."analysis_subjects" (
  "id" SERIAL PRIMARY KEY,
  "scenario_id" INTEGER NOT NULL,
  "source_message_id" INTEGER,
  "code" VARCHAR(20) NOT NULL,
  "name" VARCHAR(100) NOT NULL,
  "direction" "account_direction" NOT NULL,
  "description" TEXT,
  "account_id" INTEGER,
  "is_confirmed" BOOLEAN DEFAULT FALSE NOT NULL,
  "metadata" JSONB,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL,

  CONSTRAINT "analysis_subjects_scenario_id_fk" FOREIGN KEY ("scenario_id")
    REFERENCES "public"."scenarios"("id") ON DELETE CASCADE,
  CONSTRAINT "analysis_subjects_source_message_id_fk" FOREIGN KEY ("source_message_id")
    REFERENCES "public"."conversation_messages"("id") ON DELETE SET NULL,
  CONSTRAINT "analysis_subjects_account_id_fk" FOREIGN KEY ("account_id")
    REFERENCES "public"."accounts"("id") ON DELETE SET NULL,
  CONSTRAINT "unique_scenario_subject_code" UNIQUE("scenario_id", "code")
);
COMMENT ON TABLE "public"."analysis_subjects" IS 'Accounting subjects identified by AI, normalized storage for querying and linking';
COMMENT ON COLUMN "public"."analysis_subjects"."source_message_id" IS 'AI message that generated this subject';
COMMENT ON COLUMN "public"."analysis_subjects"."account_id" IS 'Link to actual account in chart of accounts (if mapped)';
COMMENT ON COLUMN "public"."analysis_subjects"."is_confirmed" IS 'Whether user has confirmed this subject';
COMMENT ON COLUMN "public"."analysis_subjects"."metadata" IS 'Additional metadata: {reason, examples, relatedRules}';

CREATE INDEX "idx_analysis_subjects_scenario_id" ON "public"."analysis_subjects"("scenario_id");
CREATE INDEX "idx_analysis_subjects_source_message_id" ON "public"."analysis_subjects"("source_message_id");
CREATE INDEX "idx_analysis_subjects_code" ON "public"."analysis_subjects"("code");
CREATE INDEX "idx_analysis_subjects_account_id" ON "public"."analysis_subjects"("account_id");
CREATE INDEX "idx_analysis_subjects_is_confirmed" ON "public"."analysis_subjects"("is_confirmed");

-- Analysis Entries: Journal entries extracted from AI analysis
CREATE TABLE "public"."analysis_entries" (
  "id" SERIAL PRIMARY KEY,
  "scenario_id" INTEGER NOT NULL,
  "source_message_id" INTEGER,
  "entry_id" VARCHAR(50) NOT NULL,
  "description" TEXT,
  "lines" JSONB NOT NULL,
  "amount" NUMERIC(18, 2),
  "currency" VARCHAR(10) DEFAULT 'CNY',
  "is_confirmed" BOOLEAN DEFAULT FALSE NOT NULL,
  "metadata" JSONB,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL,

  CONSTRAINT "analysis_entries_scenario_id_fk" FOREIGN KEY ("scenario_id")
    REFERENCES "public"."scenarios"("id") ON DELETE CASCADE,
  CONSTRAINT "analysis_entries_source_message_id_fk" FOREIGN KEY ("source_message_id")
    REFERENCES "public"."conversation_messages"("id") ON DELETE SET NULL,
  CONSTRAINT "unique_scenario_entry_id" UNIQUE("scenario_id", "entry_id")
);
COMMENT ON TABLE "public"."analysis_entries" IS 'Journal entries (rules) extracted from AI analysis';
COMMENT ON COLUMN "public"."analysis_entries"."entry_id" IS 'Unique identifier for this entry within the scenario (e.g., "R001", "R002")';
COMMENT ON COLUMN "public"."analysis_entries"."lines" IS 'Entry lines: [{side: "debit"|"credit", accountCode, amount, description}]';
COMMENT ON COLUMN "public"."analysis_entries"."is_confirmed" IS 'Whether user has confirmed this entry/rule';
COMMENT ON COLUMN "public"."analysis_entries"."metadata" IS 'Additional metadata: {condition, triggerEvent, formula}';

CREATE INDEX "idx_analysis_entries_scenario_id" ON "public"."analysis_entries"("scenario_id");
CREATE INDEX "idx_analysis_entries_source_message_id" ON "public"."analysis_entries"("source_message_id");
CREATE INDEX "idx_analysis_entries_entry_id" ON "public"."analysis_entries"("entry_id");
CREATE INDEX "idx_analysis_entries_is_confirmed" ON "public"."analysis_entries"("is_confirmed");

-- Analysis Diagrams: Diagrams and flowcharts from AI analysis
CREATE TABLE "public"."analysis_diagrams" (
  "id" SERIAL PRIMARY KEY,
  "scenario_id" INTEGER NOT NULL,
  "source_message_id" INTEGER,
  "diagram_type" "analysis_diagram_type" NOT NULL,
  "title" VARCHAR(200),
  "payload" JSONB NOT NULL,
  "is_confirmed" BOOLEAN DEFAULT FALSE NOT NULL,
  "metadata" JSONB,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL,

  CONSTRAINT "analysis_diagrams_scenario_id_fk" FOREIGN KEY ("scenario_id")
    REFERENCES "public"."scenarios"("id") ON DELETE CASCADE,
  CONSTRAINT "analysis_diagrams_source_message_id_fk" FOREIGN KEY ("source_message_id")
    REFERENCES "public"."conversation_messages"("id") ON DELETE SET NULL
);
COMMENT ON TABLE "public"."analysis_diagrams" IS 'Diagrams and visualizations extracted from AI analysis';
COMMENT ON COLUMN "public"."analysis_diagrams"."diagram_type" IS 'Type of diagram: mermaid (flowchart), chart (data viz), table (structured data)';
COMMENT ON COLUMN "public"."analysis_diagrams"."payload" IS 'Diagram data structure varies by type: {mermaidCode} or {chartConfig} or {tableData}';
COMMENT ON COLUMN "public"."analysis_diagrams"."is_confirmed" IS 'Whether user has confirmed this diagram';

CREATE INDEX "idx_analysis_diagrams_scenario_id" ON "public"."analysis_diagrams"("scenario_id");
CREATE INDEX "idx_analysis_diagrams_source_message_id" ON "public"."analysis_diagrams"("source_message_id");
CREATE INDEX "idx_analysis_diagrams_type" ON "public"."analysis_diagrams"("diagram_type");
CREATE INDEX "idx_analysis_diagrams_is_confirmed" ON "public"."analysis_diagrams"("is_confirmed");

-- ============================================================================
-- AI CONFIGURATION & MANAGEMENT
-- ============================================================================

-- AI Providers: External AI service providers
CREATE TABLE "public"."ai_providers" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(100) NOT NULL,
  "type" "provider_type" NOT NULL,
  "api_endpoint" VARCHAR(500) NOT NULL,
  "api_key" VARCHAR(500) NOT NULL,
  "default_model" VARCHAR(100),
  "is_default" BOOLEAN DEFAULT FALSE NOT NULL,
  "status" "provider_status" DEFAULT 'active' NOT NULL,
  "last_model_fetch" TIMESTAMP,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);
COMMENT ON TABLE "public"."ai_providers" IS 'AI service provider configurations (OpenAI, Azure, Ollama, etc.)';
COMMENT ON COLUMN "public"."ai_providers"."type" IS 'Provider type: openai, azure, ollama, or custom';
COMMENT ON COLUMN "public"."ai_providers"."api_key" IS 'Encrypted API key for authentication';
COMMENT ON COLUMN "public"."ai_providers"."is_default" IS 'Whether this is the default provider for new users';
COMMENT ON COLUMN "public"."ai_providers"."status" IS 'Operational status: active, inactive, or error';

CREATE INDEX "idx_ai_providers_status" ON "public"."ai_providers"("status");
CREATE INDEX "idx_ai_providers_is_default" ON "public"."ai_providers"("is_default");

-- AI Models: Available models per provider
CREATE TABLE "public"."ai_models" (
  "id" SERIAL PRIMARY KEY,
  "provider_id" INTEGER NOT NULL,
  "name" VARCHAR(100) NOT NULL,
  "capabilities" JSONB DEFAULT '{}',
  "cached_at" TIMESTAMP DEFAULT NOW() NOT NULL,

  CONSTRAINT "ai_models_provider_id_fk" FOREIGN KEY ("provider_id")
    REFERENCES "public"."ai_providers"("id") ON DELETE CASCADE,
  CONSTRAINT "unique_provider_model_name" UNIQUE("provider_id", "name")
);
COMMENT ON TABLE "public"."ai_models" IS 'Available AI models from each provider (cached from provider API)';
COMMENT ON COLUMN "public"."ai_models"."capabilities" IS 'Model capabilities metadata: {contextLength, supportsFunctions, maxTokens}';
COMMENT ON COLUMN "public"."ai_models"."cached_at" IS 'When this model list was last refreshed from provider';

CREATE INDEX "idx_ai_models_provider_id" ON "public"."ai_models"("provider_id");

-- Prompt Templates: Reusable prompt templates
CREATE TABLE "public"."prompt_templates" (
  "id" SERIAL PRIMARY KEY,
  "scenario_type" "prompt_scenario_type" NOT NULL UNIQUE,
  "name" VARCHAR(100) NOT NULL,
  "description" TEXT,
  "active_version_id" INTEGER,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);
COMMENT ON TABLE "public"."prompt_templates" IS 'Prompt templates for different AI analysis scenarios';
COMMENT ON COLUMN "public"."prompt_templates"."scenario_type" IS 'Type of scenario this template is for (one template per type)';
COMMENT ON COLUMN "public"."prompt_templates"."active_version_id" IS 'Currently active version of this template';

-- Prompt Versions: Version history of prompts
CREATE TABLE "public"."prompt_versions" (
  "id" SERIAL PRIMARY KEY,
  "template_id" INTEGER NOT NULL,
  "version_number" INTEGER NOT NULL,
  "content" TEXT NOT NULL,
  "variables" JSONB DEFAULT '[]',
  "created_by" INTEGER,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,

  CONSTRAINT "prompt_versions_template_id_fk" FOREIGN KEY ("template_id")
    REFERENCES "public"."prompt_templates"("id") ON DELETE CASCADE,
  CONSTRAINT "prompt_versions_created_by_fk" FOREIGN KEY ("created_by")
    REFERENCES "public"."users"("id") ON DELETE SET NULL,
  CONSTRAINT "unique_template_version_number" UNIQUE("template_id", "version_number")
);
COMMENT ON TABLE "public"."prompt_versions" IS 'Version history for prompt templates with rollback support';
COMMENT ON COLUMN "public"."prompt_versions"."content" IS 'Prompt template content with {{variables}} for substitution';
COMMENT ON COLUMN "public"."prompt_versions"."variables" IS 'Array of variable names used in this template: ["accountsList", "companyName"]';

CREATE INDEX "idx_prompt_versions_template_id" ON "public"."prompt_versions"("template_id");

-- Add foreign key for active_version_id (must be added after prompt_versions exists)
ALTER TABLE "public"."prompt_templates"
  ADD CONSTRAINT "prompt_templates_active_version_id_fk"
  FOREIGN KEY ("active_version_id")
  REFERENCES "public"."prompt_versions"("id") ON DELETE SET NULL;

-- Company Profile: Extended company information
CREATE TABLE "public"."company_profile" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(100) NOT NULL,
  "business_model" TEXT,
  "industry" VARCHAR(50),
  "accounting_preference" TEXT,
  "notes" TEXT,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);
COMMENT ON TABLE "public"."company_profile" IS 'Extended company profile for AI context (single row configuration)';
COMMENT ON COLUMN "public"."company_profile"."business_model" IS 'Description of business model for AI context';
COMMENT ON COLUMN "public"."company_profile"."accounting_preference" IS 'Accounting standards preference (e.g., "China GAAP", "IFRS")';

-- User Preferences: Per-user AI preferences
CREATE TABLE "public"."user_preferences" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL UNIQUE,
  "preferred_provider_id" INTEGER,
  "preferred_model" VARCHAR(100),
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL,

  CONSTRAINT "user_preferences_user_id_fk" FOREIGN KEY ("user_id")
    REFERENCES "public"."users"("id") ON DELETE CASCADE,
  CONSTRAINT "user_preferences_preferred_provider_id_fk" FOREIGN KEY ("preferred_provider_id")
    REFERENCES "public"."ai_providers"("id") ON DELETE SET NULL
);
COMMENT ON TABLE "public"."user_preferences" IS 'User-specific preferences for AI provider and model selection';

CREATE INDEX "idx_user_preferences_user_id" ON "public"."user_preferences"("user_id");

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Insert default company profile
INSERT INTO "public"."company_profile" ("name", "business_model", "industry", "accounting_preference")
VALUES ('默认公司', '请在管理页面配置公司信息', '未指定', '中国企业会计准则');

COMMENT ON DATABASE CURRENT_DATABASE IS 'AccountFlow - AI-assisted accounting analysis platform';
