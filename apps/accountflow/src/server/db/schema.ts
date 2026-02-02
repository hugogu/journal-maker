import { pgTable, serial, varchar, text, timestamp, integer, boolean, jsonb, pgEnum, index, unique } from 'drizzle-orm/pg-core'

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'product'])
export const scenarioStatusEnum = pgEnum('scenario_status', ['draft', 'confirmed', 'archived'])
export const accountTypeEnum = pgEnum('account_type', ['asset', 'liability', 'equity', 'revenue', 'expense'])
export const accountDirectionEnum = pgEnum('account_direction', ['debit', 'credit', 'both'])

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

// AI Config table
export const aiConfigs = pgTable('ai_configs', {
  id: serial('id').primaryKey(),
  companyId: integer('company_id').references(() => companies.id).notNull().unique(),
  apiEndpoint: varchar('api_endpoint', { length: 500 }).notNull(),
  apiKey: varchar('api_key', { length: 500 }).notNull(),
  model: varchar('model', { length: 100 }).notNull(),
  systemPrompt: text('system_prompt'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

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
