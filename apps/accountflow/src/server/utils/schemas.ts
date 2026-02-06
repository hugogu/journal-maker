import { z } from 'zod'
import { zodToJsonSchema as convertZodToJsonSchema } from 'zod-to-json-schema'
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
  providerId: z.number().int().positive().optional(),
  model: z.string().optional(),
})

export const conversationMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1),
  structuredData: z.record(z.string(), z.unknown()).optional().nullable(),
  requestLog: z.record(z.string(), z.unknown()).optional().nullable(),
  responseStats: z.record(z.string(), z.unknown()).optional().nullable(),
})

// Journal Rule schemas
export const createJournalRuleSchema = z.object({
  eventName: z.string().min(1).max(100),
  eventDescription: z.string().max(1000).optional(),
  debitAccountId: z.number().int().positive().optional(),
  creditAccountId: z.number().int().positive().optional(),
  conditions: z.record(z.string(), z.unknown()).optional(),
  amountFormula: z.string().optional(),
})

export const updateJournalRuleSchema = createJournalRuleSchema.partial()

export const structuredJournalRuleSchema = z.object({
  debitSide: z.record(z.string(), z.unknown()),
  creditSide: z.record(z.string(), z.unknown()),
  triggerType: z.string().min(1).max(50),
  status: z.enum(['proposal', 'confirmed']),
  amountFormula: z.string().optional().nullable(),
})

// Sample Transaction schemas
export const createSampleTransactionSchema = z.object({
  description: z.string().min(1).max(500),
  entries: z
    .array(
      z.object({
        accountId: z.number().int().positive(),
        debit: z.number().min(0).optional(),
        credit: z.number().min(0).optional(),
        description: z.string().min(1).max(500),
      })
    )
    .min(1),
})

// Export schemas
export const exportScenarioSchema = z.object({
  format: z.enum(['json', 'excel']),
})

// Confirmed Analysis schemas
export const accountingSubjectSchema = z.object({
  code: z
    .string()
    .min(1)
    .max(20)
    .regex(/^[A-Za-z0-9-]+$/),
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

export const confirmAnalysisRequestSchema = z
  .object({
    subjects: z.array(accountingSubjectSchema).default([]),
    rules: z.array(accountingRuleSchema).default([]),
    diagramMermaid: z.string().nullable().optional(),
    sourceMessageId: z.number().int().positive().nullable().optional(),
  })
  .refine(
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
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
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
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
})

export const analysisDiagramSchema = z.object({
  diagramType: z.enum(['mermaid', 'chart', 'table']),
  payload: z.any(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
})

export const analysisArtifactsRequestSchema = z.object({
  sourceMessageId: z.number().int().positive().optional().nullable(),
  subjects: z.array(analysisSubjectSchema).optional().default([]),
  entries: z.array(analysisEntrySchema).optional().default([]),
  diagrams: z.array(analysisDiagramSchema).optional().default([]),
})

// ============================================================================
// Schemas for function-calling and backend validation
// ============================================================================

/**
 * AccountSchema - Schema for account data validation
 */
export const AccountSchema = z.object({
  id: z.number().int().positive().optional(),
  code: z.string().min(1).max(20).describe('Account code (e.g., 1001, 2001)'),
  name: z.string().min(1).max(100).describe('Account name'),
  type: AccountType.describe('Account type: asset, liability, equity, revenue, or expense'),
  direction: AccountDirection.describe('Account normal balance direction: debit, credit, or both'),
  description: z.string().max(500).optional().describe('Optional account description'),
  parentId: z
    .number()
    .int()
    .positive()
    .optional()
    .nullable()
    .describe('Parent account ID for hierarchical structure'),
  isActive: z.boolean().default(true).describe('Whether the account is active'),
})

export type AccountSchemaType = z.infer<typeof AccountSchema>

/**
 * EntrySide - Schema for debit/credit entry side
 */
export const EntrySide = z.enum(['debit', 'credit']).describe('Entry side: debit or credit')

export type EntrySideType = z.infer<typeof EntrySide>

/**
 * JournalRuleSchema - Schema for journal entry rules with formula support
 *
 * Note on amountFormula:
 * - The formula should be a string expression that can be evaluated
 * - Supported operators: +, -, *, /, (, )
 * - Variables can reference context fields (e.g., "amount * 0.06" for 6% tax)
 * - Examples:
 *   - Simple: "amount"
 *   - Percentage: "amount * 0.13"
 *   - Complex: "(baseAmount + serviceCharge) * taxRate"
 * - AI models are encouraged to output structured AST representations for complex formulas
 */
export const JournalRuleSchema = z.object({
  id: z.number().int().positive().optional(),
  eventName: z
    .string()
    .min(1)
    .max(100)
    .describe('Business event name (e.g., "Sale Transaction", "Purchase Order")'),
  eventDescription: z
    .string()
    .max(1000)
    .optional()
    .describe('Detailed description of the business event'),
  debitAccountId: z.number().int().positive().optional().nullable().describe('Debit account ID'),
  creditAccountId: z.number().int().positive().optional().nullable().describe('Credit account ID'),
  debitSide: z
    .object({
      accountCode: z.string().min(1).max(20),
      accountName: z.string().min(1).max(100),
      amountFormula: z.string().optional().nullable(),
    })
    .optional()
    .describe('Debit side entry details'),
  creditSide: z
    .object({
      accountCode: z.string().min(1).max(20),
      accountName: z.string().min(1).max(100),
      amountFormula: z.string().optional().nullable(),
    })
    .optional()
    .describe('Credit side entry details'),
  conditions: z
    .record(z.string(), z.unknown())
    .optional()
    .nullable()
    .describe('Conditional logic for rule application'),
  amountFormula: z
    .string()
    .max(500)
    .optional()
    .nullable()
    .describe('Formula for calculating entry amount. See schema documentation for formula syntax.'),
  triggerType: z.string().max(50).optional().nullable().describe('Event trigger type'),
  status: z
    .enum(['proposal', 'confirmed'])
    .default('proposal')
    .describe('Rule status: proposal or confirmed'),
})

export type JournalRuleSchemaType = z.infer<typeof JournalRuleSchema>

/**
 * RuleProposalSchema - Schema for AI-generated rule proposals
 */
export const RuleProposalSchema = z.object({
  eventName: z.string().min(1).max(100).describe('Proposed business event name'),
  eventDescription: z
    .string()
    .max(1000)
    .optional()
    .describe('Detailed description of the proposed event'),
  reasoning: z.string().max(2000).optional().describe('AI reasoning for the proposed rule'),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .optional()
    .describe('Confidence score (0-1) for the proposal'),
  debitSide: z
    .object({
      accountCode: z.string().min(1).max(20),
      accountName: z.string().min(1).max(100),
      amountFormula: z.string().optional().nullable(),
    })
    .describe('Proposed debit side entry'),
  creditSide: z
    .object({
      accountCode: z.string().min(1).max(20),
      accountName: z.string().min(1).max(100),
      amountFormula: z.string().optional().nullable(),
    })
    .describe('Proposed credit side entry'),
  conditions: z.record(z.string(), z.unknown()).optional().describe('Proposed conditional logic'),
  amountFormula: z
    .string()
    .max(500)
    .optional()
    .nullable()
    .describe('Proposed amount calculation formula'),
  triggerType: z.string().max(50).optional().describe('Proposed trigger type'),
  alternativeRules: z
    .array(
      z.object({
        eventName: z.string(),
        reasoning: z.string().optional(),
        debitSide: z.object({
          accountCode: z.string(),
          accountName: z.string(),
        }),
        creditSide: z.object({
          accountCode: z.string(),
          accountName: z.string(),
        }),
      })
    )
    .optional()
    .describe('Alternative rule proposals'),
})

export type RuleProposalSchemaType = z.infer<typeof RuleProposalSchema>

/**
 * ScenarioContextSchema - Schema for business scenario context
 */
export const ScenarioContextSchema = z.object({
  scenarioId: z.number().int().positive().describe('Scenario ID'),
  scenarioName: z.string().min(1).max(100).describe('Scenario name'),
  scenarioDescription: z.string().max(2000).optional().describe('Detailed scenario description'),
  companyId: z.number().int().positive().describe('Company ID'),
  industry: z.string().max(50).optional().describe('Company industry'),
  accountingStandard: z
    .string()
    .max(50)
    .optional()
    .describe('Accounting standard (e.g., GAAP, IFRS)'),
  currency: z.string().max(10).default('CNY').describe('Currency code (e.g., CNY, USD, EUR)'),
  availableAccounts: z
    .array(AccountSchema)
    .optional()
    .describe('List of available accounts for this scenario'),
  existingRules: z.array(JournalRuleSchema).optional().describe('List of existing journal rules'),
  fiscalPeriod: z
    .object({
      startDate: z.string().optional().describe('Fiscal period start date (ISO 8601)'),
      endDate: z.string().optional().describe('Fiscal period end date (ISO 8601)'),
    })
    .optional()
    .describe('Fiscal period information'),
  contextVariables: z
    .record(z.string(), z.unknown())
    .optional()
    .describe('Additional context variables for rule evaluation'),
})

export type ScenarioContextSchemaType = z.infer<typeof ScenarioContextSchema>

/**
 * zodToJsonSchema - Convert Zod schema to JSON Schema format
 *
 * This function converts Zod schemas to JSON Schema format, which is useful for:
 * - OpenAI function calling definitions
 * - API documentation generation
 * - Client-side form generation
 *
 * Note: Zod v4 has built-in toJSONSchema() method which is used when available.
 *
 * @param zodSchema - The Zod schema to convert
 * @returns JSON Schema representation
 */
export function zodToJsonSchema(zodSchema: any): any {
  try {
    // Try using Zod v4's built-in toJSONSchema method
    if (typeof zodSchema.toJSONSchema === 'function') {
      const result = zodSchema.toJSONSchema()
      if (result && typeof result === 'object') {
        return result
      }
    }

    // Fallback to zod-to-json-schema library
    const result = convertZodToJsonSchema(zodSchema, {
      $refStrategy: 'none',
    })

    // Check if conversion was successful
    if (result && Object.keys(result).length > 1) {
      return result
    }

    // Final fallback for simple types
    return {
      type: 'object',
      description: 'Schema conversion - please use toJSONSchema() method',
    }
  } catch (error) {
    console.error('Error converting Zod schema to JSON Schema:', error)
    return {
      type: 'object',
      description: 'Schema conversion failed',
    }
  }
}
