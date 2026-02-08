/**
 * Database storage adapter for Drizzle ORM
 * Connects the skill to the application's database
 */

import { BaseStorageAdapter, type StorageContext } from './base'
import type { AnalysisResult, AccountingSubject, JournalRule } from '../../core/types'

/**
 * Database tables interface
 * This allows the adapter to work with any Drizzle schema
 */
export interface DatabaseTables {
  analysisSubjects: any
  analysisEntries: any
  analysisDiagrams: any
}

/**
 * Database operations interface
 * Abstracts the actual database queries
 */
export interface DatabaseOperations {
  // Subject operations
  getSubjects(scenarioId: number, confirmedOnly?: boolean): Promise<any[]>
  saveSubjects(scenarioId: number, subjects: AccountingSubject[], sourceMessageId?: number): Promise<any[]>
  confirmSubjects(scenarioId: number): Promise<void>
  deleteSubjects(scenarioId: number): Promise<void>

  // Entry operations
  getEntries(scenarioId: number, confirmedOnly?: boolean): Promise<any[]>
  saveEntries(scenarioId: number, rules: JournalRule[], sourceMessageId?: number): Promise<any[]>
  confirmEntries(scenarioId: number): Promise<void>
  deleteEntries(scenarioId: number): Promise<void>

  // Diagram operations
  getDiagram(scenarioId: number): Promise<any | null>
  saveDiagram(scenarioId: number, mermaid: string | null, sourceMessageId?: number): Promise<any>
  deleteDiagram(scenarioId: number): Promise<void>
}

/**
 * Database storage adapter
 * Persists analysis results to a relational database using Drizzle ORM
 */
export class DatabaseStorageAdapter extends BaseStorageAdapter {
  constructor(private dbOps: DatabaseOperations) {
    super()
  }

  async save(result: AnalysisResult, context?: StorageContext): Promise<AnalysisResult> {
    this.validateResult(result)

    const scenarioId = context?.scenarioId
    if (!scenarioId) {
      throw new Error('scenarioId is required in context for database storage')
    }

    const sourceMessageId = result.sourceMessageId || undefined

    // Save subjects
    await this.dbOps.saveSubjects(scenarioId, result.subjects, sourceMessageId)

    // Save rules (entries)
    await this.dbOps.saveEntries(scenarioId, result.journalRules, sourceMessageId)

    // Save diagram
    if (result.flowDiagram) {
      await this.dbOps.saveDiagram(scenarioId, result.flowDiagram, sourceMessageId)
    }

    // Return result with ID
    return {
      ...result,
      id: `scenario_${scenarioId}`,
      analyzedAt: result.analyzedAt || new Date(),
    }
  }

  async load(id: string, context?: StorageContext): Promise<AnalysisResult | null> {
    const scenarioId = this.extractScenarioId(id, context)
    if (!scenarioId) {
      return null
    }

    // Load confirmed data by default
    const confirmedOnly = true

    const [subjects, entries, diagram] = await Promise.all([
      this.dbOps.getSubjects(scenarioId, confirmedOnly),
      this.dbOps.getEntries(scenarioId, confirmedOnly),
      this.dbOps.getDiagram(scenarioId),
    ])

    if (subjects.length === 0) {
      return null
    }

    // Convert database records to skill types
    const result: AnalysisResult = {
      id,
      scenario: `Scenario ${scenarioId}`,
      subjects: subjects.map(this.convertSubject),
      journalRules: entries.map(this.convertEntry),
      flowDiagram: diagram?.payload || null,
      sourceMessageId: subjects[0]?.sourceMessageId || null,
      analyzedAt: subjects[0]?.updatedAt || subjects[0]?.createdAt || new Date(),
      metadata: {
        scenarioId,
        confirmed: true,
      },
    }

    return result
  }

  async delete(id: string, context?: StorageContext): Promise<void> {
    const scenarioId = this.extractScenarioId(id, context)
    if (!scenarioId) {
      throw new Error('Invalid analysis ID or missing scenarioId')
    }

    await Promise.all([
      this.dbOps.deleteSubjects(scenarioId),
      this.dbOps.deleteEntries(scenarioId),
      this.dbOps.deleteDiagram(scenarioId),
    ])
  }

  async list(context?: StorageContext): Promise<AnalysisResult[]> {
    // This method is not typically used in the current application
    // as we always query by scenarioId
    throw new Error('list() is not supported for database storage - use load() with specific scenarioId')
  }

  async update(id: string, updates: Partial<AnalysisResult>, context?: StorageContext): Promise<AnalysisResult> {
    const scenarioId = this.extractScenarioId(id, context)
    if (!scenarioId) {
      throw new Error('Invalid analysis ID or missing scenarioId')
    }

    const sourceMessageId = updates.sourceMessageId || undefined

    // Update subjects if provided
    if (updates.subjects) {
      await this.dbOps.saveSubjects(scenarioId, updates.subjects, sourceMessageId)
    }

    // Update rules if provided
    if (updates.journalRules) {
      await this.dbOps.saveEntries(scenarioId, updates.journalRules, sourceMessageId)
    }

    // Update diagram if provided
    if (updates.flowDiagram !== undefined) {
      await this.dbOps.saveDiagram(scenarioId, updates.flowDiagram, sourceMessageId)
    }

    // Return the updated result
    return await this.load(id, context) || updates as AnalysisResult
  }

  async confirm(id: string, context?: StorageContext): Promise<void> {
    const scenarioId = this.extractScenarioId(id, context)
    if (!scenarioId) {
      throw new Error('Invalid analysis ID or missing scenarioId')
    }

    await Promise.all([
      this.dbOps.confirmSubjects(scenarioId),
      this.dbOps.confirmEntries(scenarioId),
    ])
  }

  /**
   * Extract scenarioId from analysis ID or context
   */
  private extractScenarioId(id: string, context?: StorageContext): number | null {
    // Try to get from context first
    if (context?.scenarioId) {
      return context.scenarioId
    }

    // Try to extract from ID (format: "scenario_{id}")
    const match = id.match(/scenario_(\d+)/)
    if (match) {
      return parseInt(match[1], 10)
    }

    return null
  }

  /**
   * Convert database subject to skill type
   */
  private convertSubject(dbSubject: any): AccountingSubject {
    return {
      code: dbSubject.code,
      name: dbSubject.name,
      direction: dbSubject.direction,
      description: dbSubject.description || undefined,
      accountId: dbSubject.accountId || undefined,
      metadata: dbSubject.metadata || undefined,
    }
  }

  /**
   * Convert database entry to skill type (JournalRule)
   */
  private convertEntry(dbEntry: any): JournalRule {
    // Parse lines JSONB to extract debit/credit sides
    const lines = dbEntry.lines || []
    const debitLines = lines.filter((l: any) => l.side === 'debit')
    const creditLines = lines.filter((l: any) => l.side === 'credit')

    return {
      id: dbEntry.id,
      eventName: dbEntry.eventName || dbEntry.ruleName || '未命名规则',
      eventDescription: dbEntry.eventDescription || dbEntry.description || undefined,
      debitSide: {
        entries: debitLines.map((l: any) => ({
          accountCode: l.accountCode,
          accountName: l.accountName,
          amountFormula: l.amountFormula || l.amount?.toString(),
          description: l.description,
        })),
      },
      creditSide: {
        entries: creditLines.map((l: any) => ({
          accountCode: l.accountCode,
          accountName: l.accountName,
          amountFormula: l.amountFormula || l.amount?.toString(),
          description: l.description,
        })),
      },
      metadata: dbEntry.metadata || undefined,
    }
  }
}
