/**
 * Accounting Analysis Skill
 * Main entry point for the accounting analysis skill
 */

import { AccountingAnalyzer, type AIProvider } from './core/analyzer'
import type { StorageAdapter, StorageContext } from './adapters/storage/base'
import { MemoryStorageAdapter } from './adapters/storage/memory'
import type {
  AnalysisInput,
  AnalysisResult,
  JournalEntry,
  JournalRule,
  SampleTransaction,
  ValidationResult,
  AccountingSubject,
} from './core/types'
import {
  validateJournalEntry,
  validateJournalRule,
  validateAccountingSubjects,
  validateFormula,
} from './core/validator'

/**
 * Configuration for the Accounting Analysis Skill
 */
export interface SkillConfig {
  /** AI provider for scenario analysis */
  aiProvider: AIProvider
  /** Storage adapter (optional, defaults to memory storage) */
  storage?: StorageAdapter
  /** Default storage context */
  defaultContext?: StorageContext
}

/**
 * Accounting Analysis Skill
 * Provides AI-powered accounting analysis capabilities
 */
export class AccountingAnalysisSkill {
  private analyzer: AccountingAnalyzer
  private storage: StorageAdapter
  private defaultContext?: StorageContext

  constructor(config: SkillConfig) {
    this.analyzer = new AccountingAnalyzer(config.aiProvider)
    this.storage = config.storage || new MemoryStorageAdapter()
    this.defaultContext = config.defaultContext
  }

  /**
   * Analyze a business scenario and generate accounting artifacts
   *
   * @param input Business scenario and context
   * @param options Optional storage and analysis options
   * @returns Analysis result with subjects, rules, and diagrams
   *
   * @example
   * ```typescript
   * const result = await skill.analyze({
   *   businessScenario: "公司销售商品收到现金10000元",
   *   companyContext: {
   *     accountingStandard: AccountingStandard.CN,
   *   }
   * })
   * console.log(result.subjects) // Generated accounting subjects
   * console.log(result.journalRules) // Generated journal rules
   * ```
   */
  async analyze(
    input: AnalysisInput,
    options?: {
      /** Save the result to storage */
      save?: boolean
      /** Storage context */
      context?: StorageContext
    }
  ): Promise<AnalysisResult> {
    const result = await this.analyzer.analyze(input)

    // Save to storage if requested
    if (options?.save) {
      const context = options.context || this.defaultContext
      return await this.storage.save(result, context)
    }

    return result
  }

  /**
   * Refine an existing analysis based on feedback
   *
   * @param analysisId ID of the analysis to refine
   * @param feedback User feedback for refinement
   * @param options Optional storage and analysis options
   * @returns Refined analysis result
   *
   * @example
   * ```typescript
   * const refined = await skill.refine(
   *   "analysis_123",
   *   "请增加增值税的处理"
   * )
   * ```
   */
  async refine(
    analysisId: string,
    feedback: string,
    options?: {
      /** Save the refined result */
      save?: boolean
      /** Storage context */
      context?: StorageContext
    }
  ): Promise<AnalysisResult> {
    const context = options?.context || this.defaultContext
    const previousResult = await this.storage.load(analysisId, context)

    if (!previousResult) {
      throw new Error(`Analysis not found: ${analysisId}`)
    }

    const refinedResult = await this.analyzer.refine(previousResult, feedback)

    if (options?.save) {
      return await this.storage.update(analysisId, refinedResult, context)
    }

    return refinedResult
  }

  /**
   * Validate a journal entry
   *
   * @param entry Journal entry to validate
   * @returns Validation result with errors and warnings
   *
   * @example
   * ```typescript
   * const validation = skill.validateEntry({
   *   description: "销售商品",
   *   debitSide: { entries: [{ accountCode: "1001", amount: 1000 }] },
   *   creditSide: { entries: [{ accountCode: "6001", amount: 1000 }] }
   * })
   * console.log(validation.isValid) // true
   * ```
   */
  validateEntry(entry: JournalEntry): ValidationResult {
    return validateJournalEntry(entry)
  }

  /**
   * Validate a journal rule
   *
   * @param rule Journal rule to validate
   * @returns Validation result
   */
  validateRule(rule: JournalRule): ValidationResult {
    return validateJournalRule(rule)
  }

  /**
   * Validate accounting subjects
   *
   * @param subjects Accounting subjects to validate
   * @returns Validation result
   */
  validateSubjects(subjects: AccountingSubject[]): ValidationResult {
    return validateAccountingSubjects(subjects)
  }

  /**
   * Validate a formula string
   *
   * @param formula Formula to validate (e.g., "{{amount}} * 0.13")
   * @returns Validation result
   */
  validateFormula(formula: string): ValidationResult {
    return validateFormula(formula)
  }

  /**
   * Generate a sample transaction from a rule
   *
   * @param rule Journal rule template
   * @param variables Variable values (e.g., { amount: 1000 })
   * @returns Sample transaction
   *
   * @example
   * ```typescript
   * const transaction = skill.generateSample(rule, { amount: 1000 })
   * console.log(transaction.entries) // Generated journal entries
   * ```
   */
  generateSample(rule: JournalRule, variables: Record<string, number>): SampleTransaction {
    const resolveAmount = (formula?: string, amount?: number): number => {
      if (amount !== undefined) return amount
      if (!formula) return 0

      // Simple formula evaluation
      let resolved = formula
      for (const [key, value] of Object.entries(variables)) {
        resolved = resolved.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value))
      }

      try {
        // eslint-disable-next-line no-eval
        return eval(resolved)
      } catch {
        return 0
      }
    }

    const entries: JournalEntry[] = [
      {
        description: rule.eventDescription || rule.eventName,
        debitSide: {
          entries: rule.debitSide.entries.map(entry => ({
            ...entry,
            amount: resolveAmount(entry.amountFormula, entry.amount),
          })),
        },
        creditSide: {
          entries: rule.creditSide.entries.map(entry => ({
            ...entry,
            amount: resolveAmount(entry.amountFormula, entry.amount),
          })),
        },
        date: new Date(),
      },
    ]

    return {
      description: rule.eventDescription || rule.eventName,
      entries,
      variables,
      generatedBy: 'template',
      createdAt: new Date(),
    }
  }

  /**
   * Save an analysis result
   *
   * @param result Analysis result to save
   * @param context Storage context
   * @returns Saved result with ID
   */
  async save(result: AnalysisResult, context?: StorageContext): Promise<AnalysisResult> {
    const ctx = context || this.defaultContext
    return await this.storage.save(result, ctx)
  }

  /**
   * Load an analysis result
   *
   * @param id Analysis ID
   * @param context Storage context
   * @returns Analysis result or null if not found
   */
  async load(id: string, context?: StorageContext): Promise<AnalysisResult | null> {
    const ctx = context || this.defaultContext
    return await this.storage.load(id, ctx)
  }

  /**
   * List all analysis results
   *
   * @param context Storage context for filtering
   * @returns Array of analysis results
   */
  async list(context?: StorageContext): Promise<AnalysisResult[]> {
    const ctx = context || this.defaultContext
    return await this.storage.list(ctx)
  }

  /**
   * Delete an analysis result
   *
   * @param id Analysis ID
   * @param context Storage context
   */
  async delete(id: string, context?: StorageContext): Promise<void> {
    const ctx = context || this.defaultContext
    return await this.storage.delete(id, ctx)
  }

  /**
   * Confirm an analysis result
   *
   * @param id Analysis ID
   * @param context Storage context
   */
  async confirm(id: string, context?: StorageContext): Promise<void> {
    const ctx = context || this.defaultContext
    if (this.storage.confirm) {
      return await this.storage.confirm(id, ctx)
    }

    // Fallback: update metadata
    await this.storage.update(id, {
      metadata: {
        confirmed: true,
        confirmedAt: new Date().toISOString(),
      }
    }, ctx)
  }
}
