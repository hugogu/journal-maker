/**
 * Storage adapter interface for persisting analysis results
 * Implementations can use database, file system, memory, etc.
 */

import type { AnalysisResult } from '../../core/types'

/**
 * Storage adapter interface
 */
export interface StorageAdapter {
  /**
   * Save an analysis result
   * @param result The analysis result to save
   * @param context Optional context (e.g., scenarioId, userId)
   * @returns The saved result with ID
   */
  save(result: AnalysisResult, context?: StorageContext): Promise<AnalysisResult>

  /**
   * Load an analysis result by ID
   * @param id The analysis ID
   * @param context Optional context
   * @returns The analysis result or null if not found
   */
  load(id: string, context?: StorageContext): Promise<AnalysisResult | null>

  /**
   * Delete an analysis result
   * @param id The analysis ID
   * @param context Optional context
   */
  delete(id: string, context?: StorageContext): Promise<void>

  /**
   * List all analysis results
   * @param context Optional context for filtering
   * @returns Array of analysis results
   */
  list(context?: StorageContext): Promise<AnalysisResult[]>

  /**
   * Update an existing analysis result
   * @param id The analysis ID
   * @param updates Partial updates to apply
   * @param context Optional context
   * @returns The updated result
   */
  update(id: string, updates: Partial<AnalysisResult>, context?: StorageContext): Promise<AnalysisResult>

  /**
   * Mark an analysis as confirmed
   * @param id The analysis ID
   * @param context Optional context
   */
  confirm?(id: string, context?: StorageContext): Promise<void>
}

/**
 * Storage context for filtering and access control
 */
export interface StorageContext {
  /** User ID (for multi-tenant scenarios) */
  userId?: number
  /** Company ID (for multi-company scenarios) */
  companyId?: number
  /** Scenario ID (for application-specific context) */
  scenarioId?: number
  /** Additional context */
  metadata?: Record<string, unknown>
}

/**
 * Base storage adapter with common utilities
 */
export abstract class BaseStorageAdapter implements StorageAdapter {
  abstract save(result: AnalysisResult, context?: StorageContext): Promise<AnalysisResult>
  abstract load(id: string, context?: StorageContext): Promise<AnalysisResult | null>
  abstract delete(id: string, context?: StorageContext): Promise<void>
  abstract list(context?: StorageContext): Promise<AnalysisResult[]>
  abstract update(id: string, updates: Partial<AnalysisResult>, context?: StorageContext): Promise<AnalysisResult>

  /**
   * Generate a unique ID for an analysis result
   */
  protected generateId(): string {
    return `analysis_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }

  /**
   * Validate that an analysis result has required fields
   */
  protected validateResult(result: AnalysisResult): void {
    if (!result.scenario) {
      throw new Error('Analysis result must have a scenario')
    }
    if (!result.subjects || result.subjects.length === 0) {
      throw new Error('Analysis result must have at least one subject')
    }
  }
}
