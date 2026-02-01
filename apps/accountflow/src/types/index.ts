import { z } from 'zod'

// User Role
export const UserRole = z.enum(['admin', 'product'])
export type UserRole = z.infer<typeof UserRole>

// Account Types
export const AccountType = z.enum(['asset', 'liability', 'equity', 'revenue', 'expense'])
export type AccountType = z.infer<typeof AccountType>

export const AccountDirection = z.enum(['debit', 'credit', 'both'])
export type AccountDirection = z.infer<typeof AccountDirection>

// Scenario Status
export const ScenarioStatus = z.enum(['draft', 'confirmed', 'archived'])
export type ScenarioStatus = z.infer<typeof ScenarioStatus>

// Company
export const Company = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  industry: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
})
export type Company = z.infer<typeof Company>

// User
export const User = z.object({
  id: z.number(),
  companyId: z.number(),
  name: z.string(),
  email: z.string().email(),
  role: UserRole,
  createdAt: z.date(),
  updatedAt: z.date(),
})
export type User = z.infer<typeof User>

// AI Config
export const AIConfig = z.object({
  id: z.number(),
  companyId: z.number(),
  apiEndpoint: z.string(),
  apiKey: z.string(),
  model: z.string(),
  systemPrompt: z.string(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
})
export type AIConfig = z.infer<typeof AIConfig>

// Account
export const Account = z.object({
  id: z.number(),
  companyId: z.number(),
  code: z.string(),
  name: z.string(),
  type: AccountType,
  direction: AccountDirection,
  description: z.string().nullable(),
  parentId: z.number().nullable(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
})
export type Account = z.infer<typeof Account>

// Journal Entry
export const JournalEntry = z.object({
  accountId: z.number(),
  accountCode: z.string(),
  accountName: z.string(),
  debit: z.number().optional(),
  credit: z.number().optional(),
  description: z.string(),
})
export type JournalEntry = z.infer<typeof JournalEntry>

// Journal Rule
export const JournalRule = z.object({
  id: z.number(),
  scenarioId: z.number(),
  eventName: z.string(),
  eventDescription: z.string().nullable(),
  debitAccountId: z.number().nullable(),
  creditAccountId: z.number().nullable(),
  conditions: z.record(z.any()).nullable(),
  amountFormula: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
})
export type JournalRule = z.infer<typeof JournalRule>

// Scenario
export const Scenario = z.object({
  id: z.number(),
  companyId: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  status: ScenarioStatus,
  isTemplate: z.boolean(),
  createdBy: z.number(),
  confirmedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
})
export type Scenario = z.infer<typeof Scenario>

// Conversation
export const Conversation = z.object({
  id: z.number(),
  scenarioId: z.number(),
  userId: z.number(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  structuredData: z.record(z.any()).nullable(),
  createdAt: z.date(),
})
export type Conversation = z.infer<typeof Conversation>

// Sample Transaction
export const SampleTransaction = z.object({
  id: z.number(),
  scenarioId: z.number(),
  description: z.string(),
  entries: z.array(JournalEntry),
  generatedBy: z.enum(['ai', 'manual']),
  createdAt: z.date(),
  updatedAt: z.date(),
})
export type SampleTransaction = z.infer<typeof SampleTransaction>

// Flowchart Node
export const FlowchartNode = z.object({
  id: z.string(),
  type: z.enum(['start', 'process', 'decision', 'end', 'account']),
  label: z.string(),
  x: z.number().optional(),
  y: z.number().optional(),
  data: z.record(z.any()).optional(),
})
export type FlowchartNode = z.infer<typeof FlowchartNode>

// Flowchart Edge
export const FlowchartEdge = z.object({
  from: z.string(),
  to: z.string(),
  label: z.string().optional(),
})
export type FlowchartEdge = z.infer<typeof FlowchartEdge>

// Flowchart Data
export const FlowchartData = z.object({
  id: z.number(),
  scenarioId: z.number(),
  mermaidCode: z.string(),
  nodes: z.array(FlowchartNode).nullable(),
  edges: z.array(FlowchartEdge).nullable(),
  layout: z.record(z.any()).nullable(),
  version: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
})
export type FlowchartData = z.infer<typeof FlowchartData>
