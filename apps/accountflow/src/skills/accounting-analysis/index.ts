/**
 * Accounting Analysis Skill
 *
 * A reusable AI-powered skill for analyzing business scenarios
 * and generating accounting artifacts (subjects, journal rules, diagrams).
 *
 * @packageDocumentation
 */

// Main skill class
export { AccountingAnalysisSkill, type SkillConfig } from './skill'

// Core types
export type {
  // Input/Output
  AnalysisInput,
  AnalysisResult,

  // Accounting artifacts
  AccountingSubject,
  JournalRule,
  JournalEntry,
  JournalEntryLine,
  JournalEntrySide,

  // Context
  CompanyContext,
  ExistingAccount,

  // Validation
  ValidationResult,
  ValidationError,
  ValidationWarning,

  // Sample transactions
  SampleTransaction,

  // Enums
} from './core/types'

export {
  AccountingStandard,
  AccountType,
  AccountDirection,
} from './core/types'

// Storage adapters
export type { StorageAdapter, StorageContext } from './adapters/storage/base'
export { BaseStorageAdapter } from './adapters/storage/base'
export { MemoryStorageAdapter } from './adapters/storage/memory'

// AI providers
export type { AIProvider, AIAnalysisResponse, AIProviderConfig } from './adapters/ai-provider'
export {
  OpenAIProvider,
  OllamaProvider,
  MockAIProvider,
  createAIProvider,
} from './adapters/ai-provider'

// Analyzer
export { AccountingAnalyzer, buildSystemPrompt, buildAnalysisPrompt } from './core/analyzer'

// Validators
export {
  validateJournalEntry,
  validateJournalRule,
  validateAccountingSubjects,
  validateFormula,
} from './core/validator'

/**
 * Quick start example
 *
 * @example
 * ```typescript
 * import {
 *   AccountingAnalysisSkill,
 *   OpenAIProvider,
 *   MemoryStorageAdapter,
 *   AccountingStandard
 * } from './skills/accounting-analysis'
 *
 * // Configure AI provider
 * const aiProvider = new OpenAIProvider({
 *   apiEndpoint: 'https://api.openai.com/v1',
 *   apiKey: 'your-api-key',
 *   model: 'gpt-4',
 * })
 *
 * // Create skill instance
 * const skill = new AccountingAnalysisSkill({
 *   aiProvider,
 *   storage: new MemoryStorageAdapter(),
 * })
 *
 * // Analyze a business scenario
 * const result = await skill.analyze({
 *   businessScenario: "公司销售商品收到现金10000元",
 *   companyContext: {
 *     accountingStandard: AccountingStandard.CN,
 *   },
 * })
 *
 * console.log('Subjects:', result.subjects)
 * console.log('Rules:', result.journalRules)
 * console.log('Diagram:', result.flowDiagram)
 * ```
 */
