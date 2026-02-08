/**
 * Core types for Accounting Analysis Skill
 * These types are application-agnostic and can be used in any accounting context
 */

/**
 * Accounting standards supported by the skill
 */
export enum AccountingStandard {
  /** Chinese Accounting Standards */
  CN = 'CN',
  /** US Generally Accepted Accounting Principles */
  US_GAAP = 'US_GAAP',
  /** International Financial Reporting Standards */
  IFRS = 'IFRS',
}

/**
 * Account types in the chart of accounts
 */
export enum AccountType {
  ASSET = 'asset',
  LIABILITY = 'liability',
  EQUITY = 'equity',
  REVENUE = 'revenue',
  EXPENSE = 'expense',
}

/**
 * Normal balance direction for accounts
 */
export enum AccountDirection {
  DEBIT = 'debit',
  CREDIT = 'credit',
  BOTH = 'both',
}

/**
 * A single line in a journal entry
 */
export interface JournalEntryLine {
  /** Account code (e.g., "1001") */
  accountCode: string
  /** Account ID (optional, for linking to existing accounts) */
  accountId?: number
  /** Account name */
  accountName?: string
  /** Amount or formula (e.g., "{{amount}}", "{{amount}} * 0.13") */
  amountFormula?: string
  /** Amount (for actual transactions) */
  amount?: number
  /** Entry description */
  description?: string
}

/**
 * Debit or credit side of a journal entry
 */
export interface JournalEntrySide {
  entries: JournalEntryLine[]
}

/**
 * A complete journal entry (transaction)
 */
export interface JournalEntry {
  /** Entry description */
  description: string
  /** Debit side entries */
  debitSide: JournalEntrySide
  /** Credit side entries */
  creditSide: JournalEntrySide
  /** Entry date (optional) */
  date?: Date
  /** Additional metadata */
  metadata?: Record<string, unknown>
}

/**
 * An accounting subject (account definition)
 */
export interface AccountingSubject {
  /** Account code (e.g., "1001") */
  code: string
  /** Account name */
  name: string
  /** Account type */
  type?: AccountType
  /** Normal balance direction */
  direction: AccountDirection
  /** Account description */
  description?: string
  /** Parent account code (for hierarchical chart of accounts) */
  parentCode?: string
  /** Linked to existing account ID */
  accountId?: number | null
  /** Additional metadata */
  metadata?: Record<string, unknown>
}

/**
 * A journal rule template for recurring transactions
 */
export interface JournalRule {
  /** Rule ID (optional) */
  id?: number
  /** Business event name (e.g., "销售商品收款") */
  eventName: string
  /** Event description */
  eventDescription?: string
  /** Debit side template */
  debitSide: JournalEntrySide
  /** Credit side template */
  creditSide: JournalEntrySide
  /** Variables used in formulas */
  variables?: string[]
  /** Additional metadata */
  metadata?: Record<string, unknown>
}

/**
 * Company context for accounting analysis
 */
export interface CompanyContext {
  /** Company ID (optional) */
  id?: number
  /** Company name */
  name?: string
  /** Industry sector */
  industry?: string
  /** Accounting standard used */
  accountingStandard?: AccountingStandard
  /** Tax information */
  taxInfo?: {
    /** VAT rate (e.g., 0.13 for 13%) */
    vatRate?: number
    /** Tax registration number */
    taxNumber?: string
  }
  /** Additional context */
  metadata?: Record<string, unknown>
}

/**
 * Existing accounts in the chart of accounts
 */
export interface ExistingAccount {
  id: number
  code: string
  name: string
  type: AccountType
  direction: AccountDirection
  parentId?: number | null
}

/**
 * Input for accounting analysis
 */
export interface AnalysisInput {
  /** Business scenario description */
  businessScenario: string
  /** Company context */
  companyContext?: CompanyContext
  /** Existing accounts in the chart of accounts */
  existingAccounts?: ExistingAccount[]
  /** Accounting standard to use */
  accountingStandard?: AccountingStandard
  /** Additional context or constraints */
  constraints?: string[]
  /** Previous analysis to refine */
  previousAnalysis?: AnalysisResult
}

/**
 * Result of accounting analysis
 */
export interface AnalysisResult {
  /** Analysis ID (for storage/retrieval) */
  id?: string
  /** Input scenario */
  scenario: string
  /** Identified accounting subjects */
  subjects: AccountingSubject[]
  /** Generated journal rules */
  journalRules: JournalRule[]
  /** Flow diagram (Mermaid syntax) */
  flowDiagram?: string
  /** Confidence score (0-1) */
  confidence?: number
  /** AI reasoning/explanation */
  reasoning?: string
  /** Warnings or suggestions */
  warnings?: string[]
  /** Timestamp */
  analyzedAt?: Date
  /** Source message ID (for traceability) */
  sourceMessageId?: number | null
  /** Additional metadata */
  metadata?: Record<string, unknown>
}

/**
 * Validation result for journal entries
 */
export interface ValidationResult {
  /** Whether the entries are valid */
  isValid: boolean
  /** Validation errors */
  errors: ValidationError[]
  /** Warnings (non-blocking) */
  warnings: ValidationWarning[]
}

/**
 * Validation error
 */
export interface ValidationError {
  /** Error type */
  type: 'UNBALANCED' | 'INVALID_ACCOUNT' | 'INVALID_AMOUNT' | 'MISSING_FIELD' | 'OTHER'
  /** Error message */
  message: string
  /** Field that caused the error */
  field?: string
  /** Additional details */
  details?: Record<string, unknown>
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  /** Warning type */
  type: 'UNUSUAL_AMOUNT' | 'MISSING_DESCRIPTION' | 'ACCOUNT_MISMATCH' | 'OTHER'
  /** Warning message */
  message: string
  /** Field that triggered the warning */
  field?: string
  /** Suggestion for resolution */
  suggestion?: string
}

/**
 * Sample transaction for testing rules
 */
export interface SampleTransaction {
  /** Transaction ID */
  id?: number
  /** Transaction description */
  description: string
  /** Journal entries */
  entries: JournalEntry[]
  /** Variables used */
  variables?: Record<string, number | string>
  /** Generated by */
  generatedBy?: 'ai' | 'manual' | 'template'
  /** Creation timestamp */
  createdAt?: Date
}
