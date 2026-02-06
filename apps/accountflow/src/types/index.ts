import { z } from 'zod'

// ============================================================================
// ENUMS
// ============================================================================

export const UserRole = z.enum(['admin', 'product'])
export type UserRole = z.infer<typeof UserRole>

export const AccountType = z.enum(['asset', 'liability', 'equity', 'revenue', 'expense'])
export type AccountType = z.infer<typeof AccountType>

export const AccountDirection = z.enum(['debit', 'credit', 'both'])
export type AccountDirection = z.infer<typeof AccountDirection>

export const ScenarioStatus = z.enum(['draft', 'confirmed', 'archived'])
export type ScenarioStatus = z.infer<typeof ScenarioStatus>

export const JournalRuleStatus = z.enum(['proposal', 'confirmed'])
export type JournalRuleStatus = z.infer<typeof JournalRuleStatus>

export const MessageRole = z.enum(['user', 'assistant', 'system'])
export type MessageRole = z.infer<typeof MessageRole>

export const DiagramType = z.enum(['mermaid', 'chart', 'table'])
export type DiagramType = z.infer<typeof DiagramType>

// ============================================================================
// CORE TYPES
// ============================================================================

export const Company = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  industry: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
})
export type Company = z.infer<typeof Company>

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

// ============================================================================
// JOURNAL ENTRY STRUCTURES
// ============================================================================

// Journal Entry Line (for debit_side/credit_side structure)
export const JournalEntryLine = z.object({
  accountCode: z.string().min(1).max(20),
  accountId: z.number().optional(),
  amountFormula: z.string().optional(), // e.g., "{{amount}}" or "{{amount}} * 0.13"
  description: z.string().optional(),
})
export type JournalEntryLine = z.infer<typeof JournalEntryLine>

// Journal Entry Side (debit_side or credit_side)
export const JournalEntrySide = z.object({
  entries: z.array(JournalEntryLine),
})
export type JournalEntrySide = z.infer<typeof JournalEntrySide>

// Journal Rule (database table)
export const JournalRule = z.object({
  id: z.number(),
  scenarioId: z.number(),
  eventName: z.string(),
  eventDescription: z.string().nullable(),
  debitAccountId: z.number().nullable(), // DEPRECATED: use debitSide instead
  creditAccountId: z.number().nullable(), // DEPRECATED: use creditSide instead
  conditions: z.record(z.any()).nullable(),
  amountFormula: z.string().nullable(),
  debitSide: JournalEntrySide.nullable(),
  creditSide: JournalEntrySide.nullable(),
  triggerType: z.string().nullable(),
  status: JournalRuleStatus.nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
})
export type JournalRule = z.infer<typeof JournalRule>

// Sample Transaction Entry
export const JournalEntry = z.object({
  accountId: z.number(),
  accountCode: z.string(),
  accountName: z.string(),
  debit: z.number().optional(),
  credit: z.number().optional(),
  description: z.string(),
})
export type JournalEntry = z.infer<typeof JournalEntry>

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

// ============================================================================
// AI CONVERSATION TYPES
// ============================================================================

export const ConversationMessage = z.object({
  id: z.number(),
  scenarioId: z.number(),
  role: MessageRole,
  content: z.string(),
  timestamp: z.date(),
  structuredData: z.record(z.any()).nullable(),
  requestLog: z.record(z.any()).nullable(),
  responseStats: z.record(z.any()).nullable(),
  createdAt: z.date(),
})
export type ConversationMessage = z.infer<typeof ConversationMessage>

// ============================================================================
// ANALYSIS ARTIFACT TYPES (Normalized Storage)
// ============================================================================

// Analysis Subject (from database table)
export const AnalysisSubject = z.object({
  id: z.number(),
  scenarioId: z.number(),
  sourceMessageId: z.number().nullable(),
  code: z.string(),
  name: z.string(),
  direction: AccountDirection,
  description: z.string().nullable(),
  accountId: z.number().nullable(),
  isConfirmed: z.boolean(),
  metadata: z.record(z.any()).nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
})
export type AnalysisSubject = z.infer<typeof AnalysisSubject>

// Analysis Entry Line (for analysis_entries.lines JSONB field)
export const AnalysisEntryLine = z.object({
  side: z.enum(['debit', 'credit']),
  accountCode: z.string().min(1).max(20),
  amount: z.number().optional(),
  description: z.string().max(500).optional(),
})
export type AnalysisEntryLine = z.infer<typeof AnalysisEntryLine>

// Analysis Entry (from database table)
export const AnalysisEntry = z.object({
  id: z.number(),
  scenarioId: z.number(),
  sourceMessageId: z.number().nullable(),
  entryId: z.string(),
  description: z.string().nullable(),
  lines: z.array(AnalysisEntryLine),
  amount: z.number().nullable(),
  currency: z.string().nullable(),
  isConfirmed: z.boolean(),
  metadata: z.record(z.any()).nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
})
export type AnalysisEntry = z.infer<typeof AnalysisEntry>

// Analysis Diagram (from database table)
export const AnalysisDiagram = z.object({
  id: z.number(),
  scenarioId: z.number(),
  sourceMessageId: z.number().nullable(),
  diagramType: DiagramType,
  title: z.string().nullable(),
  payload: z.record(z.any()), // Structure varies: {mermaidCode} or {chartConfig} or {tableData}
  isConfirmed: z.boolean(),
  metadata: z.record(z.any()).nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
})
export type AnalysisDiagram = z.infer<typeof AnalysisDiagram>

// ============================================================================
// UI/API TYPES (For compatibility with existing components)
// ============================================================================

// Accounting Subject for UI (simplified from AnalysisSubject)
export const AccountingSubject = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(100),
  direction: z.enum(['debit', 'credit']),
  description: z.string().max(500).optional(),
})
export type AccountingSubject = z.infer<typeof AccountingSubject>

// Accounting Rule for UI (simplified from AnalysisEntry)
export const AccountingRule = z.object({
  id: z.string().min(1).max(50),
  description: z.string().min(1).max(500),
  condition: z.string().max(200).optional(),
  debitAccount: z.string().max(20).optional(),
  creditAccount: z.string().max(20).optional(),
})
export type AccountingRule = z.infer<typeof AccountingRule>

// ============================================================================
// CONFIRMED ANALYSIS (Aggregated from normalized tables)
// ============================================================================

export const ConfirmedAnalysis = z.object({
  scenarioId: z.number(),
  subjects: z.array(AccountingSubject),
  rules: z.array(AccountingRule),
  diagrams: z.array(z.object({
    type: DiagramType,
    title: z.string().optional(),
    payload: z.record(z.any()),
  })),
  sourceMessageId: z.number().nullable(),
  confirmedAt: z.date(),
  updatedAt: z.date(),
})
export type ConfirmedAnalysis = z.infer<typeof ConfirmedAnalysis>

// ============================================================================
// PARSED ANALYSIS (From AI response)
// ============================================================================

export const ParsedAnalysis = z.object({
  subjects: z.array(AccountingSubject),
  rules: z.array(AccountingRule),
  diagrams: z.array(z.string()), // Mermaid code strings
  rawContent: z.string(),
})
export type ParsedAnalysis = z.infer<typeof ParsedAnalysis>

// ============================================================================
// FLOWCHART TYPES (For backward compatibility - will migrate to AnalysisDiagram)
// ============================================================================

export const FlowchartNode = z.object({
  id: z.string(),
  type: z.enum(['start', 'process', 'decision', 'end', 'account']),
  label: z.string(),
  x: z.number().optional(),
  y: z.number().optional(),
  data: z.record(z.any()).optional(),
})
export type FlowchartNode = z.infer<typeof FlowchartNode>

export const FlowchartEdge = z.object({
  from: z.string(),
  to: z.string(),
  label: z.string().optional(),
})
export type FlowchartEdge = z.infer<typeof FlowchartEdge>
