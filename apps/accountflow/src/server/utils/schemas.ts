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
  apiEndpoint: z.string().url(),
  apiKey: z.string().min(1),
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
