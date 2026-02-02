import { pgTable, serial, varchar, text, timestamp, integer, boolean, jsonb, pgEnum, index, unique } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'product'])
export const scenarioStatusEnum = pgEnum('scenario_status', ['draft', 'confirmed', 'archived'])
export const accountTypeEnum = pgEnum('account_type', ['asset', 'liability', 'equity', 'revenue', 'expense'])
export const accountDirectionEnum = pgEnum('account_direction', ['debit', 'credit', 'both'])

// NEW: Prompt Management Enums
export const promptScenarioTypeEnum = pgEnum('prompt_scenario_type', [
  'scenario_analysis',
  'sample_generation',
  'prompt_generation',
  'flowchart_generation'
])

// NEW: AI Provider Enums
export const providerTypeEnum = pgEnum('provider_type', ['openai', 'azure', 'ollama', 'custom'])
export const providerStatusEnum = pgEnum('provider_status', ['active', 'inactive', 'error'])

// NEW: Conversation Message Enum
export const messageRoleEnum = pgEnum('message_role', ['user', 'assistant', 'system'])

// Company table
export const companies = pgTable('companies', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  industry: varchar('industry', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  companyId: integer('company_id').references(() => companies.id).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  role: userRoleEnum('role').notNull().default('product'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('idx_users_company_id').on(table.companyId),
])

// Accounts table (shared)
export const accounts = pgTable('accounts', {
  id: serial('id').primaryKey(),
  companyId: integer('company_id').references(() => companies.id).notNull(),
  code: varchar('code', { length: 20 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  type: accountTypeEnum('type').notNull(),
  direction: accountDirectionEnum('direction').notNull(),
  description: text('description'),
  parentId: integer('parent_id'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  unique('idx_accounts_company_code').on(table.companyId, table.code),
  index('idx_accounts_company_id').on(table.companyId),
  index('idx_accounts_type').on(table.type),
])

// Scenarios table
export const scenarios = pgTable('scenarios', {
  id: serial('id').primaryKey(),
  companyId: integer('company_id').references(() => companies.id).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  status: scenarioStatusEnum('status').default('draft').notNull(),
  isTemplate: boolean('is_template').default(false).notNull(),
  createdBy: integer('created_by').references(() => users.id).notNull(),
  confirmedAt: timestamp('confirmed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('idx_scenarios_company_id').on(table.companyId),
  index('idx_scenarios_status').on(table.status),
  index('idx_scenarios_template').on(table.isTemplate),
])

// Journal Rules table
export const journalRules = pgTable('journal_rules', {
  id: serial('id').primaryKey(),
  scenarioId: integer('scenario_id').references(() => scenarios.id).notNull(),
  eventName: varchar('event_name', { length: 100 }).notNull(),
  eventDescription: text('event_description'),
  debitAccountId: integer('debit_account_id').references(() => accounts.id),
  creditAccountId: integer('credit_account_id').references(() => accounts.id),
  conditions: jsonb('conditions'),
  amountFormula: text('amount_formula'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('idx_journal_rules_scenario_id').on(table.scenarioId),
])

// Conversations table
export const conversations = pgTable('conversations', {
  id: serial('id').primaryKey(),
  scenarioId: integer('scenario_id').references(() => scenarios.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  role: varchar('role', { length: 20 }).notNull(), // 'user' | 'assistant' | 'system'
  content: text('content').notNull(),
  structuredData: jsonb('structured_data'), // AI parsed structured response
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('idx_conversations_scenario_id').on(table.scenarioId),
  index('idx_conversations_created_at').on(table.createdAt),
])

// Sample Transactions table
export const sampleTransactions = pgTable('sample_transactions', {
  id: serial('id').primaryKey(),
  scenarioId: integer('scenario_id').references(() => scenarios.id).notNull(),
  description: text('description').notNull(),
  entries: jsonb('entries').notNull(), // Array of {accountId, debit, credit, description}
  generatedBy: varchar('generated_by', { length: 50 }).notNull(), // 'ai' | 'manual'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('idx_sample_transactions_scenario_id').on(table.scenarioId),
])

// Flowchart Data table
export const flowchartData = pgTable('flowchart_data', {
  id: serial('id').primaryKey(),
  scenarioId: integer('scenario_id').references(() => scenarios.id).notNull().unique(),
  mermaidCode: text('mermaid_code').notNull(),
  nodes: jsonb('nodes'), // Parsed node positions and metadata
  edges: jsonb('edges'), // Edge connections
  layout: jsonb('layout'), // User layout adjustments
  version: integer('version').default(1).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Account Mappings table (scenario-specific account references)
export const accountMappings = pgTable('account_mappings', {
  id: serial('id').primaryKey(),
  scenarioId: integer('scenario_id').references(() => scenarios.id).notNull(),
  accountId: integer('account_id').references(() => accounts.id).notNull(),
  usage: varchar('usage', { length: 50 }), // How this account is used in this scenario
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  unique('idx_account_mappings_scenario_account').on(table.scenarioId, table.accountId),
])

// NEW: Prompt Management Tables
export const promptTemplates = pgTable('prompt_templates', {
  id: serial('id').primaryKey(),
  scenarioType: promptScenarioTypeEnum('scenario_type').notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  activeVersionId: integer('active_version_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const promptVersions = pgTable('prompt_versions', {
  id: serial('id').primaryKey(),
  templateId: integer('template_id').notNull().references(() => promptTemplates.id, { onDelete: 'cascade' }),
  versionNumber: integer('version_number').notNull(),
  content: text('content').notNull(),
  variables: jsonb('variables').default([]),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  unique('idx_prompt_versions_template_version').on(table.templateId, table.versionNumber),
])

// NEW: AI Provider Tables
export const aiProviders = pgTable('ai_providers', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  type: providerTypeEnum('type').notNull(),
  apiEndpoint: varchar('api_endpoint', { length: 500 }).notNull(),
  apiKey: varchar('api_key', { length: 500 }).notNull(),
  defaultModel: varchar('default_model', { length: 100 }),
  isDefault: boolean('is_default').default(false).notNull(),
  status: providerStatusEnum('status').default('active').notNull(),
  lastModelFetch: timestamp('last_model_fetch'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('idx_ai_providers_status').on(table.status),
])

export const aiModels = pgTable('ai_models', {
  id: serial('id').primaryKey(),
  providerId: integer('provider_id').notNull().references(() => aiProviders.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  capabilities: jsonb('capabilities').default({}),
  cachedAt: timestamp('cached_at').defaultNow().notNull(),
}, (table) => [
  unique('idx_ai_models_provider_name').on(table.providerId, table.name),
])

// NEW: Company Profile Table
export const companyProfile = pgTable('company_profile', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  businessModel: text('business_model'),
  industry: varchar('industry', { length: 50 }),
  accountingPreference: text('accounting_preference'),
  notes: text('notes'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// NEW: Conversation Messages Table (replaces localStorage)
export const conversationMessages = pgTable('conversation_messages', {
  id: serial('id').primaryKey(),
  scenarioId: integer('scenario_id').notNull().references(() => scenarios.id, { onDelete: 'cascade' }),
  role: messageRoleEnum('role').notNull(),
  content: text('content').notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  requestLog: jsonb('request_log'),
  responseStats: jsonb('response_stats'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('idx_conversation_messages_scenario_id').on(table.scenarioId),
  index('idx_conversation_messages_timestamp').on(table.timestamp),
])

// NEW: Conversation Shares Table
export const conversationShares = pgTable('conversation_shares', {
  id: serial('id').primaryKey(),
  scenarioId: integer('scenario_id').notNull().references(() => scenarios.id, { onDelete: 'cascade' }),
  shareToken: varchar('share_token', { length: 64 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  revokedAt: timestamp('revoked_at'),
  isRevoked: boolean('is_revoked').default(false).notNull(),
}, (table) => [
  index('idx_conversation_shares_token').on(table.shareToken),
])

// NEW: User Preferences Table
export const userPreferences = pgTable('user_preferences', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  preferredProviderId: integer('preferred_provider_id').references(() => aiProviders.id),
  preferredModel: varchar('preferred_model', { length: 100 }),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Relations
export const promptTemplatesRelations = relations(promptTemplates, ({ one, many }) => ({
  activeVersion: one(promptVersions, {
    fields: [promptTemplates.activeVersionId],
    references: [promptVersions.id],
  }),
  versions: many(promptVersions),
}))

export const promptVersionsRelations = relations(promptVersions, ({ one }) => ({
  template: one(promptTemplates, {
    fields: [promptVersions.templateId],
    references: [promptTemplates.id],
  }),
  createdBy: one(users, {
    fields: [promptVersions.createdBy],
    references: [users.id],
  }),
}))

export const aiProvidersRelations = relations(aiProviders, ({ many }) => ({
  models: many(aiModels),
}))

export const aiModelsRelations = relations(aiModels, ({ one }) => ({
  provider: one(aiProviders, {
    fields: [aiModels.providerId],
    references: [aiProviders.id],
  }),
}))
