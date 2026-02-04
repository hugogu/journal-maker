/**
 * Zod schemas for Confirmed Analysis API validation
 * Place in: apps/accountflow/src/server/utils/schemas.ts (merge with existing)
 */
import { z } from 'zod'

// Accounting Subject schema
export const accountingSubjectSchema = z.object({
  code: z.string().min(1).max(20).regex(/^[A-Za-z0-9]+$/),
  name: z.string().min(1).max(100),
  direction: z.enum(['debit', 'credit']),
  description: z.string().max(500).optional(),
})

// Accounting Rule schema
export const accountingRuleSchema = z.object({
  id: z.string().min(1).max(50),
  description: z.string().min(1).max(500),
  condition: z.string().max(200).optional(),
  debitAccount: z.string().max(20).optional(),
  creditAccount: z.string().max(20).optional(),
})

// Confirm Analysis request body schema
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

// Type exports
export type AccountingSubject = z.infer<typeof accountingSubjectSchema>
export type AccountingRule = z.infer<typeof accountingRuleSchema>
export type ConfirmAnalysisRequest = z.infer<typeof confirmAnalysisRequestSchema>
