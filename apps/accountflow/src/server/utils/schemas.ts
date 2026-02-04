import { z } from 'zod'
import { AccountType, AccountDirection, UserRole, ScenarioStatus } from '../../types'

// Company schemas
export const createCompanySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  industry: z.string().max(50).optional(),
})

export const updateCompanySchema = createCompanySchema.partial()

// User schemas
export const createUserSchema = z.object({
  companyId: z.number().int().positive(),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  role: UserRole.default('product'),
})

export const updateUserSchema = createUserSchema.partial().omit({ companyId: true })

// AI Config schemas
export const createAIConfigSchema = z.object({
  apiEndpoint: z.string().url(),
  apiKey: z.string().min(1),
  model: z.string().min(1),
  systemPrompt: z.string(),
})

export const updateAIConfigSchema = createAIConfigSchema.partial()

export const testAIConnectionSchema = z.object({
  providerId: z.number().int().positive().optional(),
  providerType: z.enum(['openai', 'azure', 'ollama', 'custom']).optional(),
  apiEndpoint: z.string().url(),
  apiKey: z.string().optional(),
  model: z.string().min(1),
})

// Account schemas
export const createAccountSchema = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(100),
  type: AccountType,
  direction: AccountDirection,
  description: z.string().max(500).optional(),
  parentId: z.number().int().positive().optional(),
})

export const updateAccountSchema = createAccountSchema.partial()

// Scenario schemas
export const createScenarioSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(2000).optional(),
  isTemplate: z.boolean().default(false),
})

export const updateScenarioSchema = createScenarioSchema.partial()

export const confirmScenarioSchema = z.object({
  status: z.literal('confirmed'),
})

// Conversation schemas
export const sendMessageSchema = z.object({
  content: z.string().min(1).max(10000),
})

export const conversationMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1),
  structuredData: z.record(z.any()).optional().nullable(),
  requestLog: z.record(z.any()).optional().nullable(),
  responseStats: z.record(z.any()).optional().nullable(),
})

// Journal Rule schemas
export const createJournalRuleSchema = z.object({
  eventName: z.string().min(1).max(100),
  eventDescription: z.string().max(1000).optional(),
  debitAccountId: z.number().int().positive().optional(),
  creditAccountId: z.number().int().positive().optional(),
  conditions: z.record(z.any()).optional(),
  amountFormula: z.string().optional(),
})

export const updateJournalRuleSchema = createJournalRuleSchema.partial()

export const structuredJournalRuleSchema = z.object({
  debitSide: z.record(z.any()),
  creditSide: z.record(z.any()),
  triggerType: z.string().min(1).max(50),
  status: z.enum(['proposal', 'confirmed']),
  amountFormula: z.string().optional().nullable(),
})

// Sample Transaction schemas
export const createSampleTransactionSchema = z.object({
  description: z.string().min(1).max(500),
  entries: z.array(
    z.object({
      accountId: z.number().int().positive(),
      debit: z.number().min(0).optional(),
      credit: z.number().min(0).optional(),
      description: z.string().min(1).max(500),
    })
  ).min(1),
})

// Export schemas
export const exportScenarioSchema = z.object({
  format: z.enum(['json', 'excel']),
})

// Confirmed Analysis schemas
export const accountingSubjectSchema = z.object({
  code: z.string().min(1).max(20).regex(/^[A-Za-z0-9]+$/),
  name: z.string().min(1).max(100),
  direction: z.enum(['debit', 'credit']),
  description: z.string().max(500).optional(),
})

export const accountingRuleSchema = z.object({
  id: z.string().min(1).max(50),
  description: z.string().min(1).max(500),
  condition: z.string().max(200).optional(),
  debitAccount: z.string().max(20).optional(),
  creditAccount: z.string().max(20).optional(),
})

export const confirmAnalysisRequestSchema = z.object({
  subjects: z.array(accountingSubjectSchema).default([]),
  rules: z.array(accountingRuleSchema).default([]),
  diagramMermaid: z.string().nullable().optional(),
  sourceMessageId: z.number().int().positive().nullable().optional(),
}).refine(
  (data) =>
    data.subjects.length > 0 ||
    data.rules.length > 0 ||
    (data.diagramMermaid && data.diagramMermaid.trim().length > 0),
  {
    message: 'At least one of subjects, rules, or diagramMermaid must have content',
  }
)

// Analysis artifact schemas
export const analysisSubjectSchema = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(100),
  direction: z.enum(['debit', 'credit', 'both']),
  description: z.string().max(500).optional().nullable(),
  metadata: z.record(z.any()).optional().nullable(),
})

export const analysisEntryLineSchema = z.object({
  side: z.enum(['debit', 'credit']),
  accountCode: z.string().min(1).max(20),
  amount: z.number(),
  description: z.string().max(500).optional().nullable(),
})

export const analysisEntrySchema = z.object({
  lines: z.array(analysisEntryLineSchema).min(2),
  description: z.string().max(1000).optional().nullable(),
  amount: z.number().optional().nullable(),
  currency: z.string().max(10).optional().nullable(),
  metadata: z.record(z.any()).optional().nullable(),
})

export const analysisDiagramSchema = z.object({
  diagramType: z.enum(['mermaid', 'chart', 'table']),
  payload: z.any(),
  metadata: z.record(z.any()).optional().nullable(),
})

export const analysisArtifactsRequestSchema = z.object({
  sourceMessageId: z.number().int().positive().optional().nullable(),
  subjects: z.array(analysisSubjectSchema).optional().default([]),
  entries: z.array(analysisEntrySchema).optional().default([]),
  diagrams: z.array(analysisDiagramSchema).optional().default([]),
})
