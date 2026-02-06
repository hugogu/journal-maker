import { pgTable, serial, varchar, text, timestamp, integer, boolean, jsonb, pgEnum, index, unique, numeric } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ============================================================================
// ENUMS
// ============================================================================

export const userRoleEnum = pgEnum('user_role', ['admin', 'product'])
export const scenarioStatusEnum = pgEnum('scenario_status', ['draft', 'confirmed', 'archived'])
export const accountTypeEnum = pgEnum('account_type', ['asset', 'liability', 'equity', 'revenue', 'expense'])
export const accountDirectionEnum = pgEnum('account_direction', ['debit', 'credit', 'both'])
export const providerTypeEnum = pgEnum('provider_type', ['openai', 'azure', 'ollama', 'custom'])
export const providerStatusEnum = pgEnum('provider_status', ['active', 'inactive', 'error'])
export const promptScenarioTypeEnum = pgEnum('prompt_scenario_type', [
  'scenario_analysis',
  'sample_generation',
  'prompt_generation',
  'flowchart_generation'
])
export const messageRoleEnum = pgEnum('message_role', ['user', 'assistant', 'system'])
export const journalRuleStatusEnum = pgEnum('journal_rule_status', ['proposal', 'confirmed'])
export const analysisDiagramTypeEnum = pgEnum('analysis_diagram_type', ['mermaid', 'chart', 'table'])

// ============================================================================
// CORE BUSINESS TABLES
// ============================================================================

export const companyProfile = pgTable('company_profile', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  businessModel: text('business_model'),
  industry: varchar('industry', { length: 50 }),
  accountingPreference: text('accounting_preference'),
  notes: text('notes'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  companyId: integer('company_id').references(() => companyProfile.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  role: userRoleEnum('role').notNull().default('product'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('idx_users_company_id').on(table.companyId),
  index('idx_users_email').on(table.email),
])

export const accounts = pgTable('accounts', {
  id: serial('id').primaryKey(),
  companyId: integer('company_id').references(() => companyProfile.id, { onDelete: 'cascade' }).notNull(),
  code: varchar('code', { length: 20 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  type: accountTypeEnum('type').notNull(),
  direction: accountDirectionEnum('direction').notNull(),
  description: text('description'),
  parentId: integer('parent_id').references(() => accounts.id, { onDelete: 'set null' }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  unique('unique_company_account_code').on(table.companyId, table.code),
  index('idx_accounts_company_id').on(table.companyId),
  index('idx_accounts_type').on(table.type),
  index('idx_accounts_parent_id').on(table.parentId),
  index('idx_accounts_code').on(table.code),
])

export const scenarios = pgTable('scenarios', {
  id: serial('id').primaryKey(),
  companyId: integer('company_id').references(() => companyProfile.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  status: scenarioStatusEnum('status').default('draft').notNull(),
  isTemplate: boolean('is_template').default(false).notNull(),
  createdBy: integer('created_by').references(() => users.id, { onDelete: 'restrict' }).notNull(),
  confirmedAt: timestamp('confirmed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('idx_scenarios_company_id').on(table.companyId),
  index('idx_scenarios_status').on(table.status),
  index('idx_scenarios_created_by').on(table.createdBy),
  index('idx_scenarios_is_template').on(table.isTemplate),
])

export const journalRules = pgTable('journal_rules', {
  id: serial('id').primaryKey(),
  scenarioId: integer('scenario_id').references(() => scenarios.id, { onDelete: 'cascade' }).notNull(),
  messageId: integer('message_id').references(() => conversationMessages.id, { onDelete: 'set null' }), // 添加message_id字段
  ruleKey: varchar('rule_key', { length: 50 }).notNull(), // AI返回的event名字
  eventName: varchar('event_name', { length: 100 }).notNull(), // 使用AI返回的event.name
  eventDescription: text('event_description'),
  debitAccountId: integer('debit_account_id').references(() => accounts.id, { onDelete: 'set null' }),
  creditAccountId: integer('credit_account_id').references(() => accounts.id, { onDelete: 'set null' }),
  conditions: jsonb('conditions'),
  amountFormula: text('amount_formula'),
  debitSide: jsonb('debit_side'),
  creditSide: jsonb('credit_side'),
  triggerType: varchar('trigger_type', { length: 50 }),
  status: journalRuleStatusEnum('status').default('proposal').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  unique('unique_journal_rule').on(table.scenarioId, table.messageId, table.ruleKey), // 唯一索引：scenario + message + ruleKey
  index('idx_journal_rules_scenario_id').on(table.scenarioId),
  index('idx_journal_rules_message_id').on(table.messageId), // 添加message_id索引
  index('idx_journal_rules_rule_key').on(table.ruleKey), // 添加rule_key索引
  index('idx_journal_rules_status').on(table.status),
])

export const sampleTransactions = pgTable('sample_transactions', {
  id: serial('id').primaryKey(),
  scenarioId: integer('scenario_id').references(() => scenarios.id, { onDelete: 'cascade' }).notNull(),
  description: text('description').notNull(),
  entries: jsonb('entries').notNull(),
  generatedBy: varchar('generated_by', { length: 50 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('idx_sample_transactions_scenario_id').on(table.scenarioId),
])

// ============================================================================
// AI CONVERSATION & MESSAGING
// ============================================================================

export const conversationMessages = pgTable('conversation_messages', {
  id: serial('id').primaryKey(),
  scenarioId: integer('scenario_id').notNull().references(() => scenarios.id, { onDelete: 'cascade' }),
  role: messageRoleEnum('role').notNull(),
  content: text('content').notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  structuredData: jsonb('structured_data'),
  requestLog: jsonb('request_log'),
  responseStats: jsonb('response_stats'),
  confirmedAt: timestamp('confirmed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('idx_conversation_messages_scenario_id').on(table.scenarioId),
  index('idx_conversation_messages_timestamp').on(table.timestamp),
  index('idx_conversation_messages_role').on(table.role),
  index('idx_conversation_messages_confirmed_at').on(table.confirmedAt),
])

export const conversationShares = pgTable('conversation_shares', {
  id: serial('id').primaryKey(),
  scenarioId: integer('scenario_id').notNull().references(() => scenarios.id, { onDelete: 'cascade' }),
  shareToken: varchar('share_token', { length: 64 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  revokedAt: timestamp('revoked_at'),
  isRevoked: boolean('is_revoked').default(false).notNull(),
}, (table) => [
  index('idx_conversation_shares_token').on(table.shareToken),
  index('idx_conversation_shares_scenario_id').on(table.scenarioId),
])

// ============================================================================
// AI ANALYSIS ARTIFACTS (Normalized Storage)
// ============================================================================

export const analysisSubjects = pgTable('analysis_subjects', {
  id: serial('id').primaryKey(),
  scenarioId: integer('scenario_id').notNull().references(() => scenarios.id, { onDelete: 'cascade' }),
  sourceMessageId: integer('source_message_id').references(() => conversationMessages.id, { onDelete: 'set null' }),
  code: varchar('code', { length: 20 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  direction: accountDirectionEnum('direction').notNull(),
  description: text('description'),
  accountId: integer('account_id').references(() => accounts.id, { onDelete: 'set null' }),
  isConfirmed: boolean('is_confirmed').default(false).notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  unique('unique_scenario_subject_message_code').on(table.scenarioId, table.sourceMessageId, table.code),
  index('idx_analysis_subjects_scenario_id').on(table.scenarioId),
  index('idx_analysis_subjects_source_message_id').on(table.sourceMessageId),
  index('idx_analysis_subjects_code').on(table.code),
  index('idx_analysis_subjects_account_id').on(table.accountId),
  index('idx_analysis_subjects_is_confirmed').on(table.isConfirmed),
])

export const analysisEntries = pgTable('analysis_entries', {
  id: serial('id').primaryKey(),
  scenarioId: integer('scenario_id').notNull().references(() => scenarios.id, { onDelete: 'cascade' }),
  sourceMessageId: integer('source_message_id').references(() => conversationMessages.id, { onDelete: 'set null' }),
  entryId: varchar('entry_id', { length: 50 }).notNull(),
  eventName: varchar('event_name', { length: 100 }), // Event name for grouping entries
  description: text('description'),
  lines: jsonb('lines').notNull(),
  amount: numeric('amount', { precision: 18, scale: 2 }), // Optional: total transaction amount
  currency: varchar('currency', { length: 10 }).default('CNY'), // Optional: transaction currency
  isConfirmed: boolean('is_confirmed').default(false).notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  unique('unique_scenario_entry_message_id').on(table.scenarioId, table.sourceMessageId, table.entryId),
  index('idx_analysis_entries_scenario_id').on(table.scenarioId),
  index('idx_analysis_entries_source_message_id').on(table.sourceMessageId),
  index('idx_analysis_entries_entry_id').on(table.entryId),
  index('idx_analysis_entries_event_name').on(table.eventName),
  index('idx_analysis_entries_is_confirmed').on(table.isConfirmed),
])

export const analysisDiagrams = pgTable('analysis_diagrams', {
  id: serial('id').primaryKey(),
  scenarioId: integer('scenario_id').notNull().references(() => scenarios.id, { onDelete: 'cascade' }),
  sourceMessageId: integer('source_message_id').references(() => conversationMessages.id, { onDelete: 'set null' }),
  diagramType: analysisDiagramTypeEnum('diagram_type').notNull(),
  title: varchar('title', { length: 200 }),
  payload: jsonb('payload').notNull(),
  isConfirmed: boolean('is_confirmed').default(false).notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('idx_analysis_diagrams_scenario_id').on(table.scenarioId),
  index('idx_analysis_diagrams_source_message_id').on(table.sourceMessageId),
  index('idx_analysis_diagrams_type').on(table.diagramType),
  index('idx_analysis_diagrams_is_confirmed').on(table.isConfirmed),
])

// ============================================================================
// AI CONFIGURATION & MANAGEMENT
// ============================================================================

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
  index('idx_ai_providers_is_default').on(table.isDefault),
])

export const aiModels = pgTable('ai_models', {
  id: serial('id').primaryKey(),
  providerId: integer('provider_id').notNull().references(() => aiProviders.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  capabilities: jsonb('capabilities').default({}),
  cachedAt: timestamp('cached_at').defaultNow().notNull(),
}, (table) => [
  unique('unique_provider_model_name').on(table.providerId, table.name),
  index('idx_ai_models_provider_id').on(table.providerId),
])

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
  createdBy: integer('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  unique('unique_template_version_number').on(table.templateId, table.versionNumber),
  index('idx_prompt_versions_template_id').on(table.templateId),
])

export const userPreferences = pgTable('user_preferences', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  preferredProviderId: integer('preferred_provider_id').references(() => aiProviders.id, { onDelete: 'set null' }),
  preferredModel: varchar('preferred_model', { length: 100 }),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('idx_user_preferences_user_id').on(table.userId),
])

// ============================================================================
// RELATIONS
// ============================================================================

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

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(users, {
    fields: [userPreferences.userId],
    references: [users.id],
  }),
  preferredProvider: one(aiProviders, {
    fields: [userPreferences.preferredProviderId],
    references: [aiProviders.id],
  }),
}))

export const analysisSubjectsRelations = relations(analysisSubjects, ({ one }) => ({
  scenario: one(scenarios, {
    fields: [analysisSubjects.scenarioId],
    references: [scenarios.id],
  }),
  sourceMessage: one(conversationMessages, {
    fields: [analysisSubjects.sourceMessageId],
    references: [conversationMessages.id],
  }),
  account: one(accounts, {
    fields: [analysisSubjects.accountId],
    references: [accounts.id],
  }),
}))

export const analysisEntriesRelations = relations(analysisEntries, ({ one }) => ({
  scenario: one(scenarios, {
    fields: [analysisEntries.scenarioId],
    references: [scenarios.id],
  }),
  sourceMessage: one(conversationMessages, {
    fields: [analysisEntries.sourceMessageId],
    references: [conversationMessages.id],
  }),
}))

export const analysisDiagramsRelations = relations(analysisDiagrams, ({ one }) => ({
  scenario: one(scenarios, {
    fields: [analysisDiagrams.scenarioId],
    references: [scenarios.id],
  }),
  sourceMessage: one(conversationMessages, {
    fields: [analysisDiagrams.sourceMessageId],
    references: [conversationMessages.id],
  }),
}))
